module core::flash_loan {
    use sui::types;
    use sui::coin;
    use sui::balance;
    use sui::clock;

    use core::admin;
    use core::treasury;
    use core::protocol_fee;
    use core::utils;
    use core::version;
    use core::events;
    use core::nft;

    #[allow(unused_field)]
    public struct FlashLoanGlobalConfig has store, key {
        id: object::UID,
        version: u64,
        protocol_fee_percent_base_18: u64,
        staker_interest_percent_base_18: u64,
        total_staked: u64,
    }

    #[allow(unused_variable)]
    public fun change_fee_percentages(
        adminCap: &admin::AdminCap,
        flashLoanGlobalConfig: &mut FlashLoanGlobalConfig,
        version: &mut option::Option<u64>,
        protocol_fee: &mut option::Option<u64>,
        staker_interest: &mut option::Option<u64>,
    ) {
        if (option::is_some<u64>(freeze(version))) {
            flashLoanGlobalConfig.version = option::extract<u64>(version);
        };
        if (option::is_some<u64>(freeze(protocol_fee))) {
            flashLoanGlobalConfig.protocol_fee_percent_base_18 = option::extract<u64>(protocol_fee);
        };
        if (option::is_some<u64>(freeze(staker_interest))) {
            flashLoanGlobalConfig.staker_interest_percent_base_18 = option::extract<u64>(staker_interest);
        };
    }

    public struct Receipt<phantom T0> {
        user: address,
        amount: u64,
        typeName: vector<u8>,
        protocol_fee_percent_base_18: u64,
        staker_interest_percent_base_18: u64,
    }

    public(package) fun create_config<T0: drop>(
        witness: &T0, 
        ctx: &mut tx_context::TxContext
    ) : FlashLoanGlobalConfig {
        assert!(types::is_one_time_witness<T0>(witness), 1);
        let flashLoanGlobalConfig = FlashLoanGlobalConfig{
            id                                  : object::new(ctx), 
            version                             : version::current_version(), 
            protocol_fee_percent_base_18        : 0,
            staker_interest_percent_base_18     : 0,
            total_staked                        : 0,
        };
        flashLoanGlobalConfig
    }

    public fun loan<T>(
        flashLoanGlobalConfig: &FlashLoanGlobalConfig,
        nftConfig: &nft::NftConfig, 
        treasury: &mut treasury::Treasury,
        amount: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ): (Receipt<T>, coin::Coin<T>){
        check_version(flashLoanGlobalConfig);
        let receipt = Receipt<T>{
            user: tx_context::sender(ctx),
            typeName: utils::type_to_bytes<T>(),
            amount: amount,
            protocol_fee_percent_base_18: flashLoanGlobalConfig.protocol_fee_percent_base_18,
            staker_interest_percent_base_18: flashLoanGlobalConfig.staker_interest_percent_base_18,
        };
        if(nft::check_before_tge(nftConfig, clock) ){
            let zero_amount: u64 = amount / 25 / 1000000000;
            if(zero_amount == 0){
                nft::zero_obj_mint_with_points(
                    nftConfig, 
                    treasury,
                    10,
                    clock,
                    ctx,
                );
            };
            if(zero_amount > 0 && zero_amount <= 50){
                nft::zero_obj_mint_with_points(
                    nftConfig, 
                    treasury,
                    zero_amount,
                    clock,
                    ctx,
                );
            };
            if(zero_amount >= 50){
                nft::zero_obj_mint_with_points(
                    nftConfig, 
                    treasury,
                    50,
                    clock,
                    ctx,
                );
            };
        }else{
            let zero_amount: u64 = amount / 25;
            if(zero_amount == 0){
                nft::zero_obj_mint_with_no_points(
                    10,
                    ctx,
                );
            };
            if(zero_amount > 0 && zero_amount <= 50){
                nft::zero_obj_mint_with_no_points(
                    zero_amount,
                    ctx,
                );
            };
            if(zero_amount >= 50){
                nft::zero_obj_mint_with_no_points(
                    50,
                    ctx,
                );
            };
        };

        let total_balance = treasury::borrow_from_treasury<T>(treasury);
        let balance = balance::split<T>(
            total_balance, 
            amount
        );
        (receipt, coin::from_balance<T>(balance, ctx))
    }

    public fun repay<T>(
        treasury: &mut treasury::Treasury,
        receipt: Receipt<T>, 
        coin_in: coin::Coin<T>,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<T> {
        let mut coin_ref = coin_in;
        let protocol_fee_percent_base_18 = protocol_fee::take_percent_base_18(
            receipt.amount, 
            receipt.protocol_fee_percent_base_18
        );
        let amount_repay = receipt.amount + protocol_fee_percent_base_18;
        assert!(coin::value(&coin_ref) >= amount_repay, 0);
        let coin_repay = coin::split<T>(&mut coin_ref, amount_repay, ctx);
        treasury::deposit<T>(treasury, coin_repay);
        let Receipt {
            user: _,
            typeName: _,
            amount: amount,
            protocol_fee_percent_base_18: _,
            staker_interest_percent_base_18: _,
        } = receipt;
        events::emit_flashloan_event(utils::type_to_bytes<T>(), amount, ctx );
        coin_ref
    }

    fun check_version(flashLoanGlobalConfig: &FlashLoanGlobalConfig) {
        version::check_version(flashLoanGlobalConfig.version);
    }
}
