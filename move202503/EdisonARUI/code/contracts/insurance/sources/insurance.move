module hashcat_insurance::insurance {
    // 导入必要的模块
    use sui::object::{Self, ID, UID};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;
    
    // 导入保险NFT模块
    use hashcat_insurance::insurance_nft;
    // 导入TEST_BTC代币模块
    use hashcat_coin::test_btc::{Self, TEST_BTC};
    
    // 添加资金池模块导入
    use hashcat_fund::fund::{Self, FinancePool, InsuranceCapability};
    
    // 错误码
    const EInsufficientPremium: u64 = 1;
    const EInvalidDuration: u64 = 2;
    const EInvalidAmount: u64 = 3;
    const EInvalidProof: u64 = 4;
    const EInsuranceExpired: u64 = 5;
    const EInsuranceNotExpired: u64 = 6;
    const EUnauthorized: u64 = 7;
    const ENotFound: u64 = 8;
    
    // 保单管理对象 - 移除内部资金池
    struct PolicyManager has key {
        id: UID,
        // 基准费率（以 TEST_BTC 的百分比表示）
        base_rate: u64,
        // 波动性系数
        hashrate_volatility: u64,
        // 保单表: policy_id -> Policy
        policies: Table<ID, Policy>,
        // 管理员地址
        admin: address,
    }
    
    // 保单信息
    struct Policy has store {
        // 保单ID
        id: ID,
        // 被保险金额
        amount: u64,
        // 保险期限（以天为单位）
        duration: u64,
        // 开始时间
        start_time: u64,
        // 保费
        premium: u64,
        // 保单所有者
        owner: address,
        // 保单状态: 0=有效, 1=已赔付, 2=已过期赎回
        status: u8,
    }
    
    // 事件定义
    // 保险NFT铸造事件
    struct InsuranceMintEvent has copy, drop {
        policy_id: ID,
        nft_id: ID,
        owner: address,
        amount: u64,
        duration: u64,
        premium: u64,
    }
    
    // 保险赔付事件
    struct InsuranceClaimEvent has copy, drop {
        policy_id: ID,
        owner: address,
        amount: u64,
    }
    
    
    // 初始化函数 - 不再初始化内部资金池
    fun init(ctx: &mut TxContext) {
        let policy_manager = PolicyManager {
            id: object::new(ctx),
            base_rate: 2, // 2% 基础费率
            hashrate_volatility: 5, // 5% 波动率
            policies: table::new(ctx),
            admin: tx_context::sender(ctx),
        };
        
        transfer::share_object(policy_manager);
    }
    
    // 铸造保险NFT - 修改为使用共享资金池
    public entry fun mint_insurance(
        policy_manager: &mut PolicyManager,
        finance_pool: &mut FinancePool,
        insurance_cap: &InsuranceCapability,
        amount: u64,
        duration: u64,
        premium: Coin<TEST_BTC>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 验证参数
        assert!(amount > 0, EInvalidAmount);
        assert!(duration > 0, EInvalidDuration);
        
        // 计算保费
        let required_premium = calculate_premium(policy_manager, amount, duration);
        let premium_value = coin::value(&premium);
        
        // 验证支付的保费是否足够
        assert!(premium_value >= required_premium, EInsufficientPremium);
        
        // 存入资金到共享资金池
        fund::deposit_shared_fund(
            finance_pool,
            premium,
            clock::timestamp_ms(clock)
        );
        
        // 创建保单ID
        let policy_id = object::new(ctx);
        let id_copy = object::uid_to_inner(&policy_id);
        
        // 创建保单
        let policy = Policy {
            id: id_copy,
            amount,
            duration,
            start_time: clock::timestamp_ms(clock) / 1000, // 转换为秒
            premium: premium_value,
            owner: tx_context::sender(ctx),
            status: 0, // 有效
        };
        
        // 存储保单
        table::add(&mut policy_manager.policies, id_copy, policy);
        
        // 准备NFT名称和描述
        let name = b"HashCAT Insurance";
        let description_text = b"Hashrate protection insurance for ";
        let amount_str = amount_to_bytes(amount);
        vector::append(&mut description_text, amount_str);
        vector::append(&mut description_text, b" for ");
        let duration_str = amount_to_bytes(duration);
        vector::append(&mut description_text, duration_str);
        vector::append(&mut description_text, b" days");
        
        // 铸造NFT并转移给用户
        let nft_id = insurance_nft::mint(
            id_copy,
            name,
            description_text,
            tx_context::sender(ctx),
            ctx
        );
        
        // 发出事件
        event::emit(InsuranceMintEvent {
            policy_id: id_copy,
            nft_id,
            owner: tx_context::sender(ctx),
            amount,
            duration,
            premium: premium_value,
        });
        
        // 释放保单ID
        object::delete(policy_id);
    }
    
    // 申请保险赔付 - 修改为使用共享资金池
    public entry fun claim(
        policy_manager: &mut PolicyManager,
        finance_pool: &mut FinancePool,
        insurance_cap: &InsuranceCapability,
        policy_id: ID,
        proof: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 验证保单存在
        assert!(table::contains(&policy_manager.policies, policy_id), EUnauthorized);
        
        // 获取保单的可变引用
        let policy = table::borrow_mut(&mut policy_manager.policies, policy_id);
        
        // 验证保单属于调用者
        assert!(policy.owner == tx_context::sender(ctx), EUnauthorized);
        
        // 验证保单状态为有效
        assert!(policy.status == 0, EInsuranceExpired);
        
        // 验证证明数据（在实际实现中需要进一步完善）
        // 这里简化为验证proof不为空
        assert!(vector::length(&proof) > 0, EInvalidProof);
        
        // 标记保单已赔付
        policy.status = 1;
        
        // 从共享资金池中提取赔付金额给调用的用户
        fund::withdraw_insurance(
            finance_pool,
            insurance_cap,
            policy.amount,
            clock::timestamp_ms(clock),
            ctx
        );
        
        
        // 发出赔付事件
        event::emit(InsuranceClaimEvent {
            policy_id: policy_id,
            owner: tx_context::sender(ctx),
            amount: policy.amount,
        });
    }
    
    // 更新基准费率（仅管理员）
    public entry fun update_base_rate(
        policy_manager: &mut PolicyManager,
        new_rate: u64,
        ctx: &mut TxContext
    ) {
        // 验证调用者是管理员
        assert!(tx_context::sender(ctx) == policy_manager.admin, EUnauthorized);
        policy_manager.base_rate = new_rate;
    }
    
    // 更新波动性系数（仅管理员）
    public entry fun update_volatility(
        policy_manager: &mut PolicyManager,
        new_volatility: u64,
        ctx: &mut TxContext
    ) {
        // 验证调用者是管理员
        assert!(tx_context::sender(ctx) == policy_manager.admin, EUnauthorized);
        policy_manager.hashrate_volatility = new_volatility;
    }
    
    // 计算保费
    fun calculate_premium(
        policy_manager: &PolicyManager,
        amount: u64,
        duration: u64
    ): u64 {
        // 简化线性定价模型
        // premium = base_rate * (1 + hashrate_volatility / 100) * amount * duration / 365;
        let volatility_factor = 100 + policy_manager.hashrate_volatility;
        let daily_rate = (policy_manager.base_rate * volatility_factor) / 100;
        let annual_premium = (amount * daily_rate) / 10000; // 基准费率以百分点表示
        
        // 按比例计算期限
        (annual_premium * duration) / 365
    }
    
    // 辅助函数：将u64转换为字节数组表示
    fun amount_to_bytes(amount: u64): vector<u8> {
        let result = vector::empty<u8>();
        let temp = amount;
        
        // 处理 amount = 0 的特殊情况
        if (temp == 0) {
            vector::push_back(&mut result, 48); // ASCII '0'
            return result
        };
        
        // 计算所需字符数
        let count = 0;
        temp = amount;
        while (temp > 0) {
            temp = temp / 10;
            count = count + 1;
        };
        
        // 分配空间
        let i = count;
        while (i > 0) {
            let digit = (amount / pow(10, i - 1)) % 10;
            vector::push_back(&mut result, (48 + (digit as u8))); // ASCII '0' + digit
            i = i - 1;
        };
        
        result
    }
    
    // 辅助函数：计算指数 (base^exp)
    fun pow(base: u64, exp: u64): u64 {
        let result = 1;
        let i = 0;
        while (i < exp) {
            result = result * base;
            i = i + 1;
        };
        result
    }
    
    // 根据保单ID获取保单信息
    public fun get_policy_by_id(
        policy_manager: &PolicyManager,
        policy_id: ID
    ): &Policy {
        assert!(table::contains(&policy_manager.policies, policy_id), ENotFound);
        table::borrow(&policy_manager.policies, policy_id)
    }
}
