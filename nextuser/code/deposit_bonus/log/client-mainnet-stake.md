# sui system stake
# 质押
```ts	

	
	    public entry fun request_add_stake(
        wrapper: &mut SuiSystemState,
        stake: Coin<SUI>,
        validator_address: address,
        ctx: &mut TxContext,
    ) 
	
	    /// Add stake to a validator's staking pool.
    public entry fun request_add_stake(
        wrapper: &mut SuiSystemState,
        stake: Coin<SUI>,
        validator_address: address,
        ctx: &mut TxContext,
    ) {
        let staked_sui = request_add_stake_non_entry(wrapper, stake, validator_address, ctx);
        transfer::public_transfer(staked_sui, ctx.sender());
    }

    /// The non-entry version of `request_add_stake`, which returns the staked SUI instead of transferring it to the sender.
    public fun request_add_stake_non_entry(
        wrapper: &mut SuiSystemState,
        stake: Coin<SUI>,
        validator_address: address,
        ctx: &mut TxContext,
    ): StakedSui {
        let self = load_system_state_mut(wrapper);
        self.request_add_stake(stake, validator_address, ctx)
    }

    /// Add stake to a validator's staking pool using multiple coins.
    public entry fun request_add_stake_mul_coin(
        wrapper: &mut SuiSystemState,
        stakes: vector<Coin<SUI>>,
        stake_amount: option::Option<u64>,
        validator_address: address,
        ctx: &mut TxContext,
    )
```

## 取钱
```ts
    /// Withdraw stake from a validator's staking pool.
    public entry fun request_withdraw_stake(
        wrapper: &mut SuiSystemState,
        staked_sui: StakedSui,
        ctx: &mut TxContext,
    ) {
        let withdrawn_stake = request_withdraw_stake_non_entry(wrapper, staked_sui, ctx);
        transfer::public_transfer(withdrawn_stake.into_coin(ctx), ctx.sender());
    }


```

# 取利息：
    fun withdraw_rewards(
        pool: &mut StakingPool,
        principal_withdraw_amount: u64,
        pool_token_withdraw_amount: u64,
        epoch: u64,
    ) : Balance<SUI> {


## 会把利息也取出来
request_withdraw_stake_non_entry 


## 计算利息

### devnet
#
export VD_ADDR=0x02d64a032bf03369213e9ea870018b765fbd848fa5ecbc33f9546f9d3e0858d7
#查看validator地址，可以看到POOL 对象地址
export POOL=0x52c7765ca92424827130afe25439f60f2703ea524d5e6198ecc7c64800fa588a
export SYSTEM_STATE=0x5


#### 存入5个sui  
 sui client ptb --split-coins gas [5000000000] --assign coin1 --move-call 0x3::sui_system::request_add_stake  @$SYSTEM_STATE coin1 @$VD_ADDR
 
 export CLIENT_ADDR=`sui client active-address`
 sui client objects $CLIENT_ADDR
 
 # 查询到stakeobject
 export STAKE_OBJ=0xc3bc20ea5e545fb273764755bedd57271f3afcd76d97cb82c21eae355a59aaf2
 sui client ptb --move-call 0x3::sui_system::request_withdraw_stake @$SYSTEM_STATE @$STAKE_OBJ

# 钱包地址
export WALLET_ADDR=0xafe36044ef56d22494bfe6231e78dd128f097693f2d974761ee4d649e61f5fa2

## mainnet计算利息

### 定义变量
#### validator 可以用钱包stake一次查看到。

export VD_ADDR=0x4fffd0005522be4bc029724c7f0f6ed7093a6bf3a09b90e62f61dc15181e1a3e
#查看validator地址，可以看到POOL 对象地址  mysten-1
export POOL=0x748a0ce980c3804d21267a4d359ac5c64bd40cb6a3e02a527b45f828cf8fd30d
export SYSTEM_STATE=0x5


#### 存入1个sui  
 sui client ptb --split-coins gas [1000000000] --assign coin1 --move-call \
 0x3::sui_system::request_add_stake  @$SYSTEM_STATE coin1 @$VD_ADDR
 # 输出信息里面有StakeSui
 
 export CLIENT_ADDR=`sui client active-address`
 sui client objects $CLIENT_ADDR
 export STAKE_OBJ=0x6aba4d3378bad22996bc3fb9ffa60b25f46ab74df36018b14bb08c2a417ee785
  
 # 查询到stakeobject
 export STAKE_OBJ=0x63dc4f8092871600b8a8b7542ea74280eba69be3b322fe0a135079b51bbbd4e3
 sui client ptb --move-call 0x3::sui_system::request_withdraw_stake @$SYSTEM_STATE @$STAKE_OBJ