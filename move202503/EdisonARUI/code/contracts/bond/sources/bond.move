module hashcat_bond::bond_pkg {
    use sui::object::{Self, ID, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::math;
    use sui::table::{Self, Table};
    use sui::event;
    // 导入TEST_BTC代币模块
    use hashcat_coin::test_btc::{Self, TEST_BTC};
    // 添加资金池模块导入
    use hashcat_fund::fund::{Self, FinancePool, BondCapability};

    // 债券管理对象
    struct BondPool has key {
        id: UID,
        base_apy: u64,
        insurance_factor: u64,
        total_bonds: u64,
        last_update: u64,
        // 跟踪债券ID
        bond_notes: Table<ID, BondNoteInfo>
    }

    // 债券信息（存储在表中）
    struct BondNoteInfo has store {
        face_value: u64,
        purchase_time: u64,
        maturity: u64,
        is_redeemed: bool,
        owner: address
    }

    // 债券凭证对象（转移给用户）
    struct BondNote has key, store {
        id: UID,
        note_id: ID,
        face_value: u64,
        purchase_time: u64,
        maturity: u64
    }

    // 事件定义
    struct BondPurchaseEvent has copy, drop {
        bond_id: ID,
        amount: u64,
        face_value: u64,
        owner: address
    }

    struct BondRedeemEvent has copy, drop {
        bond_id: ID,
        face_value: u64,
        payout: u64,
        owner: address
    }

    //===========
    // 初始化模块
    //===========
    fun init(ctx: &mut TxContext) {
        let pool = BondPool {
            id: object::new(ctx),
            base_apy: 1000, // 初始APY 10%
            insurance_factor: 100,
            total_bonds: 0,
            last_update: 0, // 将在首次使用时更新
            bond_notes: table::new(ctx)
        };
        transfer::share_object(pool);
    }

    //===========
    // 核心函数
    //===========
    public entry fun buy_bond(
        pool: &mut BondPool,
        finance_pool: &mut FinancePool,
        bond_cap: &BondCapability,
        payment: Coin<TEST_BTC>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let price = calculate_bond_price(pool, finance_pool);
        let bond_value = (amount * 10000) / price;

        // 存入资金到共享资金池
        fund::deposit_bond(
            finance_pool,
            bond_cap,
            payment,
            clock::timestamp_ms(clock) / 1000
        );
        
        pool.total_bonds = pool.total_bonds + bond_value;

        // 创建债券信息
        let note_id = object::new(ctx);
        let id_inner = object::uid_to_inner(&note_id);
        let owner = tx_context::sender(ctx);
        let purchase_time = clock::timestamp_ms(clock) / 1000;
        let maturity = 31536000; // 1年
        
        let note_info = BondNoteInfo {
            face_value: bond_value,
            purchase_time,
            maturity,
            is_redeemed: false,
            owner
        };
        
        // 存储债券信息
        table::add(&mut pool.bond_notes, id_inner, note_info);
        
        // 创建债券凭证并转移给购买者
        let note = BondNote {
            id: object::new(ctx),
            note_id: id_inner,
            face_value: bond_value,
            purchase_time,
            maturity
        };
        
        transfer::transfer(note, owner);
        
        // 发出购买事件
        event::emit(BondPurchaseEvent {
            bond_id: id_inner,
            amount,
            face_value: bond_value,
            owner
        });
        
        update_apy(pool, finance_pool, clock);
        
        // 销毁临时UID对象
        object::delete(note_id);
    }

    public entry fun redeem_bond(
        pool: &mut BondPool,
        finance_pool: &mut FinancePool,
        bond_cap: &BondCapability,
        note: BondNote,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let BondNote {
            id,
            note_id,
            face_value: _,
            purchase_time: _,
            maturity: _
        } = note;
        
        // 验证债券存在
        assert!(table::contains(&pool.bond_notes, note_id), 0);
        
        // 先获取债券信息，复制我们需要的值
        let info = table::borrow(&pool.bond_notes, note_id);
        let face_value = info.face_value;
        let is_redeemed = info.is_redeemed;
        let owner = info.owner;
        let purchase_time = info.purchase_time;
        let maturity = info.maturity;
        
        // 验证债券
        assert!(!is_redeemed, 0);
        assert!(tx_context::sender(ctx) == owner, 0);
        assert!(clock::timestamp_ms(clock) / 1000 > purchase_time + maturity, 1);

        // 计算赎回金额
        let current_price = calculate_bond_price(pool, finance_pool);
        let payout_amount = (face_value * current_price) / 10000;
        
        // 从共享资金池提取资金
        fund::withdraw_bond(
            finance_pool,
            bond_cap,
            payout_amount,
            clock::timestamp_ms(clock) / 1000,
            ctx
        );

        // 更新债券状态
        let mut_note_info = table::borrow_mut(&mut pool.bond_notes, note_id);
        mut_note_info.is_redeemed = true;
        
        // 发出赎回事件
        event::emit(BondRedeemEvent {
            bond_id: note_id,
            face_value,
            payout: payout_amount,
            owner
        });
        
        pool.total_bonds = pool.total_bonds - face_value;
        update_apy(pool, finance_pool, clock);
        
        // 销毁债券凭证
        object::delete(id);
    }

    //===========
    // 定价模型
    //===========
    fun calculate_bond_price(pool: &BondPool, finance_pool: &FinancePool): u64 {
        let reserve = fund::bond_balance(finance_pool);
        let adjusted = reserve * (100 - pool.insurance_factor) / 100;
        let price = 10000 + (adjusted / 1000000);
        
        // 使用简单的最大值最小值约束代替clamp
        if (price < 10000) { 
            10000 
        } else if (price > 15000) { 
            15000 
        } else { 
            price 
        }
    }

    fun update_apy(pool: &mut BondPool, finance_pool: &FinancePool, clock: &Clock) {
        let current_time = clock::timestamp_ms(clock) / 1000;
        
        if (pool.last_update == 0) {
            // 首次更新
            pool.last_update = current_time;
        } else {
            let time_elapsed = current_time - pool.last_update;
            let reserve = fund::bond_balance(finance_pool);
    
            // APY衰减模型
            let decay = (time_elapsed * reserve) / 1000000;
            
            if (pool.base_apy > decay) {
                pool.base_apy = pool.base_apy - decay;
            } else {
                pool.base_apy = 100; // 最低0.1%
            };
            
            pool.last_update = current_time;
        }
    }
}
