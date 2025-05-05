module core::router {
    use std::u64;
    use sui::coin;
    use sui::package;
    use sui::clock;

    use core::events;
    use core::protocol_fee;
    use core::treasury;
    use core::admin;
    use core::utils;
    use core::flash_loan;
    use core::nft;
    use core::staking;

    public struct ROUTER has drop { }
    
    public struct RouterMetadata has copy, drop {
        typeName: vector<u8>,
        amount: u64,
    }
    
    #[allow(lint(coin_field))]
    public struct RouterCap<phantom T0> {
        coin: coin::Coin<T0>,
        first_swap: RouterMetadata,
        previous_swap: RouterMetadata,
        final_swap: RouterMetadata,
        take_fees_on_coin_out: bool,
    }
        
    fun init(witness: ROUTER, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);

        let protocolFeeConfig = protocol_fee::create_config<ROUTER>(&witness, ctx);

        let flashLoanGlobalConfig = flash_loan::create_config<ROUTER>(&witness, ctx);
        transfer::public_share_object<flash_loan::FlashLoanGlobalConfig>(flashLoanGlobalConfig);

        let nftConfig = nft::create_config<ROUTER>(&witness, ctx);
        transfer::public_share_object<nft::NftConfig>(nftConfig);

        let stakeConfig = staking::create_config<ROUTER>(&witness, ctx);
        transfer::public_share_object<staking::StakeConfig>(stakeConfig);

        transfer::public_share_object<protocol_fee::ProtocolFeeConfig>(protocolFeeConfig);

        transfer::public_share_object<treasury::Treasury>(treasury::create_treasury(ctx));
        
        transfer::public_transfer<admin::AdminCap>(admin::create_admin_cap(ctx), sender);
        transfer::public_transfer<package::Publisher>(package::claim<ROUTER>(witness, ctx), sender);
    }
    
    fun assert_fee_was_not_taken_from_coin_in(arg0: bool) {
        assert!(arg0, 6);
    }
    
    fun assert_fee_was_taken_from_coin_in(arg0: bool) {
        assert!(!arg0, 6);
    }
    
    fun assert_previous_swap_was_valid<T0>(routerCap: &RouterCap<T0>) {
        assert!(is_valid_final_swap<T0>(routerCap), 4);
    }
    
    fun assert_route_starts_with_non_zero_value(arg0: u64) {
        assert!(arg0 > 0, 1);
    }

    fun assert_route_starts_with_zero_value(arg0: u64) {
        assert!(arg0 == 0, 1);
    }
        
    fun calculate_percentage(value: u64, percent_base_18: u64) : u64 {
        ((value as u128) * (percent_base_18 as u128) / (1000000000000000000 as u128)) as u64
    }
    
    public fun begin_router_stake_and_collect_fees<T0>(
        platform: vector<u8>,
        coin: coin::Coin<T0>,
        protocol_fee: &protocol_fee::ProtocolFeeConfig,
        nftConfig: &nft::NftConfig,
        treasury: &mut treasury::Treasury,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) : RouterCap<T0> {
        let amount_in = coin::value<T0>(&coin);
        assert_route_starts_with_non_zero_value(amount_in);
        let mut coin_ref = coin;
        protocol_fee::distribute_protocol_fees<T0>(protocol_fee, treasury, &mut coin_ref, ctx);
        nft::zero_obj_mint_with_points(
            nftConfig, 
            treasury,
            nft::get_points_per_lending(nftConfig),
            clock,
            ctx,
        );
        let first_swap = RouterMetadata{
            typeName   : utils::type_to_bytes<T0>(), 
            amount : amount_in,
        };
        let previous_swap = RouterMetadata{
            typeName   : b"", 
            amount     : 0,
        };
        let final_swap = RouterMetadata{
            typeName   : platform, 
            amount     : 0,
        };
        RouterCap<T0>{
            coin                  : coin_ref,
            first_swap            : first_swap, 
            previous_swap         : previous_swap, 
            final_swap            : final_swap,
            take_fees_on_coin_out : false,
        }
    }

    public fun end_router_stake<T0>(
        routerCap: RouterCap<T0>,
        referral: address,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(referral != sender, 0);
        assert_previous_swap_was_valid<T0>(&routerCap);
        let mut routerSwapCap_ref = routerCap;
        update_final_swap_metadata<T0>(&mut routerSwapCap_ref);
        assert_fee_was_taken_from_coin_in(routerSwapCap_ref.take_fees_on_coin_out);
        let RouterCap {
            coin                  : coin,
            first_swap            : first_swap,
            previous_swap         : _,
            final_swap            : final_swap,
            take_fees_on_coin_out : _,
        } = routerSwapCap_ref;
        coin::destroy_zero<T0>(coin);
        events::emit_stake_completed_event(
            first_swap.typeName,
            first_swap.amount,
            final_swap.typeName,
            0,
            referral,
            ctx
        );
    }

    public fun begin_router_unstake<T0>(
        platform: vector<u8>,
        coin: 0x2::coin::Coin<T0>,
    ) : RouterCap<T0> {
        let amount_in = 0x2::coin::value<T0>(&coin);
        assert_route_starts_with_zero_value(amount_in);
        let first_swap = RouterMetadata{
            typeName   : platform, 
            amount     : 0,
        };
        let previous_swap = RouterMetadata{
            typeName   : b"", 
            amount     : 0,
        };
        let final_swap = RouterMetadata{
            typeName   : utils::type_to_bytes<T0>(), 
            amount     : 0,
        };
        RouterCap<T0>{
            coin                  : coin,
            first_swap            : first_swap,
            previous_swap         : previous_swap,
            final_swap            : final_swap,
            take_fees_on_coin_out : true,
        }
    }
    
    #[allow(lint(self_transfer))]
    public fun end_router_unstake_and_pay_fees<T0>(
        routerCap: RouterCap<T0>,
        protocol_fee: &protocol_fee::ProtocolFeeConfig,
        nftConfig: &nft::NftConfig,
        treasury: &mut treasury::Treasury,
        referral: address,
        clock: &clock::Clock,
        ctx: &mut 0x2::tx_context::TxContext
    ): coin::Coin<T0> {
        let sender = tx_context::sender(ctx);
        assert!(referral != sender, 0);
        assert_previous_swap_was_valid<T0>(&routerCap);
        let mut routerWithdrawCap_ref = routerCap;
        update_final_swap_metadata<T0>(&mut routerWithdrawCap_ref);
        assert_fee_was_not_taken_from_coin_in(routerWithdrawCap_ref.take_fees_on_coin_out);
        let RouterCap {
            coin                  : coin_out,
            first_swap            : first_swap,
            previous_swap         : _,
            final_swap            : final_swap,
            take_fees_on_coin_out : _,
        } = routerWithdrawCap_ref;
        let mut coin_out_ref = coin_out;
        protocol_fee::distribute_protocol_fees<T0>(protocol_fee, treasury, &mut coin_out_ref, ctx);
        nft::zero_obj_mint_with_points(
            nftConfig, 
            treasury,
            nft::get_points_per_lending(nftConfig),
            clock,
            ctx,
        );
        events::emit_unstake_completed_event(
            first_swap.typeName, 
            0, 
            final_swap.typeName, 
            final_swap.amount,
            referral,
            ctx
        );
        coin_out_ref
    }

    public fun initiate_path_stake<T0>(
        routerCap: &mut RouterCap<T0>, 
        amount: u64, 
        ctx: &mut tx_context::TxContext
    ) : coin::Coin<T0> {
        assert_previous_swap_was_valid<T0>(routerCap);
        update_final_swap_metadata<T0>(routerCap);
        update_previous_swap_metadata<T0>(routerCap, utils::type_to_bytes<T0>(), amount);
        coin::split<T0>(&mut routerCap.coin, amount, ctx)
    }

    public fun initiate_path_unstake<T0>(
        routerCap: &mut RouterCap<T0>
    ) {
        assert_previous_swap_was_valid<T0>(routerCap);
        update_final_swap_metadata<T0>(routerCap);
        update_previous_swap_metadata<T0>(routerCap, utils::type_to_bytes<T0>(), 0);
    }
    
    public fun initiate_path_by_percent<T0>(
        routerCap: &mut RouterCap<T0>, 
        percent_base_18: u64, 
        ctx: &mut tx_context::TxContext
    ) : coin::Coin<T0> {
        let amount_in = if (percent_base_18 == 0) {
            coin::value<T0>(&routerCap.coin)
        } else {
            u64::min(calculate_percentage(routerCap.first_swap.amount, percent_base_18), coin::value<T0>(&routerCap.coin))
        };
        initiate_path_stake<T0>(routerCap, amount_in, ctx)
    }
    
    fun is_valid_final_swap<T0>(routerCap: &RouterCap<T0>) : bool {
        routerCap.previous_swap.typeName == routerCap.final_swap.typeName || routerCap.previous_swap.amount == 0
    }
    
    public(package) fun update_final_swap_metadata<T0>(routerCap: &mut RouterCap<T0>) {
        routerCap.final_swap.amount = routerCap.final_swap.amount + routerCap.previous_swap.amount;
    }

    public fun update_path_metadata_stake<T0>(
        routerCap: &mut RouterCap<T0>,
        platform: vector<u8>,
        amount: u64
    ) {
        update_previous_swap_metadata<T0>(routerCap, platform, amount);
    }

    public fun update_path_metadata_unstake<T0>(
        routerCap: &mut RouterCap<T0>,
        coin: coin::Coin<T0>,
    ) {
        let amount = coin::value<T0>(&coin);
        routerCap.coin.join(coin);
        update_previous_swap_metadata<T0>(routerCap, utils::type_to_bytes<T0>(), amount);
    }
    
    public(package) fun update_previous_swap_metadata<T0>(
        routerCap: &mut RouterCap<T0>, 
        typeName: vector<u8>, 
        amount: u64
    ) {
        let routerMetadata = RouterMetadata{
            typeName   : typeName, 
            amount : amount,
        };
        routerCap.previous_swap = routerMetadata;
    }
}
