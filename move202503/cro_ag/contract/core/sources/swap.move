module core::swap {
    use std::u64;
    use sui::coin;
    use sui::clock;
    
    use core::treasury;
    use core::protocol_fee;
    use core::events;
    use core::utils;
    use core::nft;

    public struct ROUTER has drop { }
    
    public struct RouterMetadata has copy, drop {
        typeName: vector<u8>,
        amount: u64,
    }
    
    #[allow(lint(coin_field))]
    public struct RouterCap<phantom T0, phantom T1> {
        coin_in: coin::Coin<T0>,
        coin_out: coin::Coin<T1>,
        first_swap: RouterMetadata,
        previous_swap: RouterMetadata,
        final_swap: RouterMetadata,
    }
    
    public fun assert_expected_coin_in<T0, T1>(routerCap: &RouterCap<T0, T1>, coin: &coin::Coin<T1>) {
        assert!(is_valid_swap<T0, T1>(routerCap, coin), 1);
    }
    
    fun assert_previous_swap_was_valid<T0, T1>(routerCap: &RouterCap<T0, T1>) {
        assert!(is_valid_final_swap<T0, T1>(routerCap), 4);
    }
    
    fun assert_route_starts_with_non_zero_value(arg0: u64) {
        assert!(arg0 > 0, 1);
    }
        
    fun calculate_percentage(value: u64, percent_base_18: u64) : u64 {
        ((value as u128) * (percent_base_18 as u128) / (1000000000000000000 as u128)) as u64
    }
    
    public fun begin_swap_router<T0, T1>(
        coin_in: 0x2::coin::Coin<T0>,
        ctx: &mut tx_context::TxContext
    ) : RouterCap<T0, T1> {
        let amount_in = 0x2::coin::value<T0>(&coin_in);
        assert_route_starts_with_non_zero_value(amount_in);
        let first_swap = RouterMetadata{
            typeName   : utils::type_to_bytes<T0>(), 
            amount     : amount_in,
        };
        let previous_swap = RouterMetadata{
            typeName   : b"", 
            amount     : 0,
        };
        let final_swap = RouterMetadata{
            typeName   : utils::type_to_bytes<T1>(), 
            amount     : 0,
        };
        RouterCap<T0, T1>{
            coin_in               : coin_in,
            coin_out              : coin::zero<T1>(ctx),
            first_swap            : first_swap,
            previous_swap         : previous_swap,
            final_swap            : final_swap,
        }
    }
    
    public fun end_swap_router<T0, T1>(
        routerCap: RouterCap<T0, T1>,
        protocol_fee: &protocol_fee::ProtocolFeeConfig,
        nftConfig: &nft::NftConfig, 
        treasury: &mut treasury::Treasury,
        referral: address,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ):coin::Coin<T1> {
        let sender = tx_context::sender(ctx);
        assert!(referral != sender, 0);
        assert_previous_swap_was_valid<T0, T1>(&routerCap);
        let mut routerSwapCap_ref = routerCap;
        update_final_swap_metadata<T0, T1>(&mut routerSwapCap_ref);
        let RouterCap {
            coin_in               : coin_in,
            coin_out              : coin_out,
            first_swap            : first_swap,
            previous_swap         : _,
            final_swap            : final_swap,
        } = routerSwapCap_ref;
        let mut coin_out_ref = coin_out;
        protocol_fee::distribute_protocol_fees<T1>(protocol_fee, treasury, &mut coin_out_ref, ctx);
        nft::zero_obj_mint_with_points(
            nftConfig, 
            treasury,
            nft::get_points_per_swap(nftConfig),
            clock,
            ctx,
        );
        coin::destroy_zero<T0>(coin_in);
        events::emit_swap_completed_event(
            first_swap.typeName,
            first_swap.amount,
            final_swap.typeName,
            final_swap.amount,
            referral,
            ctx
        );
        coin_out_ref
    }

    public fun initiate_path<T0, T1>(
        routerCap: &mut RouterCap<T0, T1>, 
        amount: u64, 
        ctx: &mut tx_context::TxContext
    ) : coin::Coin<T0> {
        assert_previous_swap_was_valid<T0, T1>(routerCap);
        update_final_swap_metadata<T0, T1>(routerCap);
        update_previous_swap_metadata<T0, T1>(routerCap, utils::type_to_bytes<T0>(), amount);
        coin::split<T0>(&mut routerCap.coin_in, amount, ctx)
    }
    
    public fun initiate_path_by_percent<T0, T1>(
        routerCap: &mut RouterCap<T0, T1>, 
        percent_base_18: u64, 
        ctx: &mut tx_context::TxContext
    ) : coin::Coin<T0> {
        let amount_in = if (percent_base_18 == 0) {
            coin::value<T0>(&routerCap.coin_in)
        } else {
            u64::min(calculate_percentage(routerCap.first_swap.amount, percent_base_18), coin::value<T0>(&routerCap.coin_in))
        };
        initiate_path<T0, T1>(routerCap, amount_in, ctx)
    }
    
    fun is_valid_final_swap<T0, T1>(routerCap: &RouterCap<T0, T1>) : bool {
        routerCap.previous_swap.typeName == routerCap.final_swap.typeName || routerCap.previous_swap.amount == 0
    }
    
    fun is_valid_swap<T0, T1>(routerCap: &RouterCap<T0, T1>, arg1: &coin::Coin<T1>) : bool {
        routerCap.previous_swap.typeName == utils::type_to_bytes<T1>() && routerCap.previous_swap.amount == coin::value<T1>(arg1)
    }
    
    public(package) fun update_final_swap_metadata<T0, T1>(routerCap: &mut RouterCap<T0, T1>) {
        routerCap.final_swap.amount = routerCap.final_swap.amount + routerCap.previous_swap.amount;
    }

    public fun update_path_metadata<T0, T1>(
        routerCap: &mut RouterCap<T0, T1>,
        coin: coin::Coin<T1>,
    ) {
        let amount = coin::value<T1>(&coin);
        routerCap.coin_out.join(coin);
        update_previous_swap_metadata<T0, T1>(routerCap, utils::type_to_bytes<T1>(), amount);
    }
    
    public(package) fun update_previous_swap_metadata<T0, T1>(
        routerCap: &mut RouterCap<T0, T1>, 
        typeName: vector<u8>, 
        amount: u64
    ) {
        let routerMetadata = RouterMetadata{
            typeName   : typeName, 
            amount     : amount,
        };
        routerCap.previous_swap = routerMetadata;
    }
}
