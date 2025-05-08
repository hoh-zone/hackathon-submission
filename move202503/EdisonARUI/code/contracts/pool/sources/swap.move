/// 一个简单的代币交换模块
module hashcat_pool::move_swap {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;

    /// 错误码
    const E_INSUFFICIENT_BALANCE: u64 = 0;
    const E_INVALID_AMOUNT: u64 = 1;
    const E_SAME_COIN_TYPE: u64 = 2;

    /// 交换池结构
    struct SwapPool<phantom CoinTypeX, phantom CoinTypeY> has key {
        id: UID,
        reserve_x: Balance<CoinTypeX>,
        reserve_y: Balance<CoinTypeY>,
        fee_percent: u64, // 以基点表示，例如30表示0.3%
    }

    /// 交换事件
    struct SwapEvent has copy, drop {
        pool_id: address,
        sender: address,
        recipient: address,
        amount_in: u64,
        amount_out: u64,
        fee: u64,
    }

    /// 创建新的交换池
    public fun create_pool<CoinTypeX, CoinTypeY>(
        coin_x: Coin<CoinTypeX>,
        coin_y: Coin<CoinTypeY>,
        fee_percent: u64,
        ctx: &mut TxContext
    ) {
        // 验证费率在合理范围内 (0-5%)
        assert!(fee_percent <= 500, 3);

        let pool = SwapPool<CoinTypeX, CoinTypeY> {
            id: object::new(ctx),
            reserve_x: coin::into_balance(coin_x),
            reserve_y: coin::into_balance(coin_y),
            fee_percent,
        };

        // 共享池对象
        transfer::share_object(pool);
    }

    /// 添加流动性到池中
    public fun add_liquidity<CoinTypeX, CoinTypeY>(
        pool: &mut SwapPool<CoinTypeX, CoinTypeY>,
        coin_x: Coin<CoinTypeX>,
        coin_y: Coin<CoinTypeY>,
        ctx: &mut TxContext
    ) {
        let balance_x = coin::into_balance(coin_x);
        let balance_y = coin::into_balance(coin_y);

        balance::join(&mut pool.reserve_x, balance_x);
        balance::join(&mut pool.reserve_y, balance_y);
    }

    /// 从池中移除流动性
    public fun remove_liquidity<CoinTypeX, CoinTypeY>(
        pool: &mut SwapPool<CoinTypeX, CoinTypeY>,
        amount_x: u64,
        amount_y: u64,
        ctx: &mut TxContext
    ) : (Coin<CoinTypeX>, Coin<CoinTypeY>){
        let reserve_x = balance::value(&pool.reserve_x);
        let reserve_y = balance::value(&pool.reserve_y);

        assert!(amount_x <= reserve_x && amount_y <= reserve_y, E_INSUFFICIENT_BALANCE);

        let coin_x = coin::from_balance(balance::split(&mut pool.reserve_x, amount_x), ctx);
        let coin_y = coin::from_balance(balance::split(&mut pool.reserve_y, amount_y), ctx);
        (coin_x, coin_y)
    }
    /// 从池中移除流动性（入口函数）
    public entry fun remove_liquidity_entry<CoinTypeX, CoinTypeY>(
        pool: &mut SwapPool<CoinTypeX, CoinTypeY>,
        amount_x: u64,
        amount_y: u64,
        ctx: &mut TxContext
    ) {
        let (coin_x, coin_y) = remove_liquidity(pool, amount_x, amount_y, ctx);
        transfer::public_transfer(coin_x, tx_context::sender(ctx));
        transfer::public_transfer(coin_y, tx_context::sender(ctx));
    }

    /// 执行代币交换
    public fun swap<CoinTypeX, CoinTypeY>(
        pool: &mut SwapPool<CoinTypeX, CoinTypeY>,
        coin_in: Coin<CoinTypeX>,
        min_amount_out: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let amount_in = coin::value(&coin_in);
        assert!(amount_in > 0, E_INVALID_AMOUNT);

        let reserve_in = balance::value(&pool.reserve_x);
        let reserve_out = balance::value(&pool.reserve_y);

        // 计算输出金额（使用恒定乘积公式）
        let amount_in_with_fee = amount_in * (10000 - pool.fee_percent);
        let amount_out = (amount_in_with_fee * reserve_out) / (reserve_in * 10000 + amount_in_with_fee);

        assert!(amount_out >= min_amount_out, E_INSUFFICIENT_BALANCE);

        // 更新池子余额
        let balance_in = coin::into_balance(coin_in);
        balance::join(&mut pool.reserve_x, balance_in);
        let coin_out = coin::from_balance(balance::split(&mut pool.reserve_y, amount_out), ctx);

        // 转移输出代币给接收者
        transfer::public_transfer(coin_out, recipient);

        // 发出交换事件
        event::emit(SwapEvent {
            pool_id: object::uid_to_address(&pool.id),
            sender: tx_context::sender(ctx),
            recipient,
            amount_in,
            amount_out,
            fee: amount_in * pool.fee_percent / 10000,
        });
    }

    /// 反向交换（从 CoinTypeY 到 CoinTypeX）
    public fun swap_reverse<CoinTypeX, CoinTypeY>(
        pool: &mut SwapPool<CoinTypeX, CoinTypeY>,
        coin_in: Coin<CoinTypeY>,
        min_amount_out: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let amount_in = coin::value(&coin_in);
        assert!(amount_in > 0, E_INVALID_AMOUNT);

        let reserve_in = balance::value(&pool.reserve_y);
        let reserve_out = balance::value(&pool.reserve_x);

        // 计算输出金额（使用恒定乘积公式）
        let amount_in_with_fee = amount_in * (10000 - pool.fee_percent);
        let amount_out = (amount_in_with_fee * reserve_out) / (reserve_in * 10000 + amount_in_with_fee);

        assert!(amount_out >= min_amount_out, E_INSUFFICIENT_BALANCE);

        // 更新池子余额
        let balance_in = coin::into_balance(coin_in);
        balance::join(&mut pool.reserve_y, balance_in);
        let coin_out = coin::from_balance(balance::split(&mut pool.reserve_x, amount_out), ctx);

        // 转移输出代币给接收者
        transfer::public_transfer(coin_out, recipient);

        // 发出交换事件
        event::emit(SwapEvent {
            pool_id: object::uid_to_address(&pool.id),
            sender: tx_context::sender(ctx),
            recipient,
            amount_in,
            amount_out,
            fee: amount_in * pool.fee_percent / 10000,
        });
    }

    /// 获取池子中的代币余额
    public fun get_reserves<CoinTypeX, CoinTypeY>(
        pool: &SwapPool<CoinTypeX, CoinTypeY>
    ): (u64, u64) {
        (
            balance::value(&pool.reserve_x),
            balance::value(&pool.reserve_y)
        )
    }

    /// 获取池子的费率
    public fun get_fee_percent<CoinTypeX, CoinTypeY>(
        pool: &SwapPool<CoinTypeX, CoinTypeY>
    ): u64 {
        pool.fee_percent
    }
} 