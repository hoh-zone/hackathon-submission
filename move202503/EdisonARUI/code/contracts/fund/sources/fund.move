module hashcat_fund::fund {
    use sui::object::{Self, ID, UID};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::event;
    use hashcat_coin::test_btc::{Self, TEST_BTC};

    // 错误码
    const EInsufficientFunds: u64 = 1;
    const EUnauthorized: u64 = 2;
    
    // 资金池对象（共用一个reserve）
    struct FinancePool has key {
        id: UID,
        reserve: Balance<TEST_BTC>,
        admin: address           // 管理员地址
    }
    
    // 权限控制 - 保险模块权限
    struct InsuranceCapability has key, store {
        id: UID
    }
    
    // 权限控制 - 债券模块权限
    struct BondCapability has key, store {
        id: UID
    }
    
    // 资金操作事件
    struct FundDepositEvent has copy, drop {
        amount: u64,
        service: u8, // 0:保险, 1:债券
        timestamp: u64
    }
    
    struct FundWithdrawEvent has copy, drop {
        amount: u64,
        service: u8, // 0:保险, 1:债券
        timestamp: u64
    }

    // 初始化资金池
    fun init(ctx: &mut TxContext) {
        let finance_pool = FinancePool {
            id: object::new(ctx),
            reserve: balance::zero<TEST_BTC>(),
            admin: tx_context::sender(ctx)
        };
        
        // 创建并分发权限对象
        let insurance_cap = InsuranceCapability {
            id: object::new(ctx)
        };
        
        let bond_cap = BondCapability {
            id: object::new(ctx)
        };
        
        // 分享资金池对象
        transfer::share_object(finance_pool);
        
        // 转移权限对象给管理员
        transfer::transfer(insurance_cap, tx_context::sender(ctx));
        transfer::transfer(bond_cap, tx_context::sender(ctx));
    }

    // 存入资金 - 保险模块/债券模块共用
    public fun deposit_shared_fund(
        pool: &mut FinancePool,
        payment: Coin<TEST_BTC>,
        timestamp: u64
    ) {
        let amount = coin::value(&payment);
        balance::join(&mut pool.reserve, coin::into_balance(payment));
        event::emit(FundDepositEvent {
            amount,
            service: 0,
            timestamp
        });
    }
    // 取出资金 - 保险模块/债券模块共用
    public fun withdraw_insurance(
        pool: &mut FinancePool,
        _cap: &InsuranceCapability,
        amount: u64,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(balance::value(&pool.reserve) >= amount, EInsufficientFunds);
        let coin_balance = balance::split(&mut pool.reserve, amount);
        let coin = coin::from_balance(coin_balance, ctx);
        event::emit(FundWithdrawEvent {
            amount,
            service: 0,
            timestamp
        });
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }
    public fun withdraw_bond(
        pool: &mut FinancePool,
        _cap: &BondCapability,
        amount: u64,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(balance::value(&pool.reserve) >= amount, EInsufficientFunds);
        let coin_balance = balance::split(&mut pool.reserve, amount);
        let coin = coin::from_balance(coin_balance, ctx);
        event::emit(FundWithdrawEvent {
            amount,
            service: 1,
            timestamp
        });
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }
    // 查询总资金量
    public fun total_balance(pool: &FinancePool): u64 {
        balance::value(&pool.reserve)
    }
}
