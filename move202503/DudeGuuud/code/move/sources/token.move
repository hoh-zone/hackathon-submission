module narr_flow::token {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::option::some;
    use sui::url;
    use sui::url::Url;
    // 错误代码
    const EInsufficientBalance: u64 = 0;
    const ENotAuthorized: u64 = 1;
    const EInvalidAmount: u64 = 2;
    
    // === 类型 ===
    
    // TOKEN 代币类型
    public struct TOKEN has drop {}
    
    // 平台财务管理结构
    public struct Treasury has key {
        id: UID,
        balance: Balance<TOKEN>,
        admin: address
    }
    
    // === 事件 ===
    
    public struct TokensRewarded has copy, drop {
        receiver: address,
        amount: u64,
        reward_type: u8,
        story_id: Option<ID>
    }
    
    // 奖励类型常量
    const REWARD_TYPE_START_NEW_BOOK: u8 = 0;
    const REWARD_TYPE_PARAGRAPH_ADDITION: u8 = 1;
    const REWARD_TYPE_ARCHIVE: u8 = 2;
    
    // === 初始化函数 ===
    
    // 一次性初始化函数，创建代币并设置财库
    fun init(witness: TOKEN, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/DudeGuuud/NarrFlow-Web3/refs/heads/dev/public/logo_white.png");
        let yes = some<Url>(url);
        // 创建TOKEN代币
        let (mut treasury_cap, metadata) = coin::create_currency(
            witness, // 见证者模式
            9, // 小数位
            b"NARR", // 符号
            b"NARR", // 名称
            b"Coin For Narrflow", // 描述
            yes, // 图标URL
            ctx
        );
        
        // 创建平台财库
        let mut treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            admin: sender
        };
        
        // 初始铸造1,000,000,000枚代币到财库中
        let initial_supply = 1_000_000_000_000_000_000; // 1 billion tokens with 9 decimals
        let minted_coins = coin::mint(&mut treasury_cap, initial_supply, ctx);
        let minted_balance = coin::into_balance(minted_coins);
        balance::join(&mut treasury.balance, minted_balance);
        
        // 转移资产给部署者
        transfer::share_object(treasury);
        transfer::public_transfer(treasury_cap, sender);
        transfer::public_transfer(metadata, sender);
    }
    
    // === 公共函数 ===
    
    // 奖励开启新书
    public fun reward_start_new_book(
        treasury: &mut Treasury,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        let receiver = tx_context::sender(ctx);
        let reward_amount = 100_000_000_000; // 100 tokens with 9 decimals
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_START_NEW_BOOK,
            story_id: option::some(story_id)
        });
    }
    
    // 奖励段落添加
    public fun reward_paragraph_addition(
        treasury: &mut Treasury,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        let receiver = tx_context::sender(ctx);
        let reward_amount = 20_000_000_000; // 20 tokens with 9 decimals
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_PARAGRAPH_ADDITION,
            story_id: option::some(story_id)
        });
    }
    
    // 奖励归档
    public fun reward_archive(
        treasury: &mut Treasury,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        let receiver = tx_context::sender(ctx);
        let reward_amount = 50_000_000_000; // 50 tokens with 9 decimals
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_ARCHIVE,
            story_id: option::some(story_id)
        });
    }
    
    // === 内部辅助函数 ===
    
    // 从财库中提取代币
    fun extract_from_treasury(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<TOKEN> {
        // 检查财库余额是否足够
        assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);
        
        // 从财库余额中提取代币
        let extracted_balance = balance::split(&mut treasury.balance, amount);
        
        // 将余额转换为硬币对象并返回
        coin::from_balance(extracted_balance, ctx)
    }
    
    // === 访问器函数 ===
    
    // 获取财库余额
    public fun get_treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }
    
    // 检查地址是否为财库管理员
    public fun is_admin(treasury: &Treasury, addr: address): bool {
        addr == treasury.admin
    }
} 