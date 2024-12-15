    # stake
    ```ts
    public fun request_add_stake_non_entry(
        wrapper: &mut SuiSystemState,
        stake: Coin<SUI>,
        validator_address: address,
        ctx: &mut TxContext,
    ): StakedSui {
        let self = load_system_state_mut(wrapper);
        self.request_add_stake(stake, validator_address, ctx)
    }

    ```


    ```ts
   public fun request_withdraw_stake_non_entry(
        wrapper: &mut SuiSystemState,
        staked_sui: StakedSui,
        ctx: &mut TxContext,
    ) : Balance<SUI> 


    ```
