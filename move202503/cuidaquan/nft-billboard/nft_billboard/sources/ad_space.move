module nft_billboard::ad_space {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};

    // 错误码
    const ENotCreator: u64 = 1;
    const EInvalidPrice: u64 = 2;
    const EInvalidLeaseDays: u64 = 3;
    const EInvalidSize: u64 = 4;

    // 广告位结构
    public struct AdSpace has key, store {
        id: UID,
        game_id: String,          // 游戏ID
        location: String,         // 位置信息
        size: String,            // 广告尺寸
        is_available: bool,        // 是否可购买
        creator: address,          // 创建者地址
        created_at: u64,           // 创建时间
        fixed_price: u64,          // 基础固定价格(以SUI为单位，表示一天的租赁价格)
    }

    // 事件定义
    public struct AdSpaceCreated has copy, drop {
        ad_space_id: ID,
        game_id: String,
        location: String,
        size: String,
        creator: address
    }

    public struct AdSpacePriceUpdated has copy, drop {
        ad_space_id: ID,
        new_price: u64,
        updated_by: address
    }

    public struct AdSpaceAvailabilityUpdated has copy, drop {
        ad_space_id: ID,
        is_available: bool,
        updated_by: address
    }

    // 广告位删除事件
    public struct AdSpaceDeleted has copy, drop {
        ad_space_id: ID,
        deleted_by: address
    }

    // 创建广告位
    public fun create_ad_space(
        game_id: String,
        location: String,
        size: String,
        fixed_price: u64,
        creator: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): AdSpace {
        // 验证广告尺寸格式 (例如: "16:9")
        let size_bytes = *string::as_bytes(&size);
        let mut has_colon = false;
        let size_len = vector::length(&size_bytes);

        let mut i = 0;
        while (i < size_len) {
            if (*vector::borrow(&size_bytes, i) == 58) { // ASCII ':'
                has_colon = true;
                break
            };
            i = i + 1;
        };

        assert!(has_colon, EInvalidSize);

        let current_time = clock::timestamp_ms(clock) / 1000;

        let ad_space = AdSpace {
            id: object::new(ctx),
            game_id,
            location,
            size,
            is_available: true,
            creator,
            created_at: current_time,
            fixed_price,
        };

        event::emit(AdSpaceCreated {
            ad_space_id: object::id(&ad_space),
            game_id,
            location,
            size,
            creator
        });

        ad_space
    }

    // 更新广告位价格
    public fun update_price(
        ad_space: &mut AdSpace,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == ad_space.creator, ENotCreator);

        ad_space.fixed_price = new_price;

        event::emit(AdSpacePriceUpdated {
            ad_space_id: object::id(ad_space),
            new_price,
            updated_by: tx_context::sender(ctx)
        });
    }

    // 设置广告位可用性
    public fun set_availability(
        ad_space: &mut AdSpace,
        is_available: bool,
        ctx: &mut TxContext
    ) {
        // 检查是否为创建者
        assert!(tx_context::sender(ctx) == ad_space.creator, ENotCreator);

        ad_space.is_available = is_available;

        event::emit(AdSpaceAvailabilityUpdated {
            ad_space_id: object::id(ad_space),
            is_available,
            updated_by: tx_context::sender(ctx)
        });
    }

    // Getter 函数
    public fun is_available(ad_space: &AdSpace): bool {
        ad_space.is_available
    }

    public fun get_creator(ad_space: &AdSpace): address {
        ad_space.creator
    }

    public fun get_fixed_price(ad_space: &AdSpace): u64 {
        ad_space.fixed_price
    }

    public fun get_metadata(ad_space: &AdSpace): (String, String, String) {
        (ad_space.game_id, ad_space.location, ad_space.size)
    }

    // 获取广告位的游戏ID
    public fun get_game_id(ad_space: &AdSpace): String {
        ad_space.game_id
    }

    // 获取广告位的 UID
    public fun get_uid(ad_space: &AdSpace): &UID {
        &ad_space.id
    }

    // 共享广告位对象
    public fun share_ad_space(ad_space: AdSpace) {
        transfer::share_object(ad_space)
    }

    // 删除广告位
    public fun delete_ad_space(
        ad_space: AdSpace,
        ctx: &mut TxContext
    ) {
        // 确保只有创建者可以删除广告位
        assert!(tx_context::sender(ctx) == ad_space.creator, ENotCreator);

        // 发送删除事件
        event::emit(AdSpaceDeleted {
            ad_space_id: object::id(&ad_space),
            deleted_by: tx_context::sender(ctx)
        });

        // 解构并删除广告位
        let AdSpace { id, game_id: _, location: _, size: _, is_available: _, creator: _, created_at: _, fixed_price: _ } = ad_space;
        object::delete(id);
    }

    /// 使用几何级数公式计算租赁价格
    public fun calculate_lease_price(ad_space: &AdSpace, lease_days: u64): u64 {
        // 验证租赁天数在有效范围内
        assert!(lease_days > 0 && lease_days <= 365, EInvalidLeaseDays);

        let daily_price = ad_space.fixed_price;  // Y - 一天的租赁价格
        let ratio = 977000; // a - 比例因子，这里设为0.977000
        let base = 1000000; // 用于表示小数的基数
        let min_daily_factor = 500000; // 最低日因子(1/2)

        // 如果只租一天，直接返回每日价格
        if (lease_days == 1) {
            return daily_price
        };

        // 计算租赁总价
        let mut total_price = daily_price; // 第一天的价格
        let mut factor = base; // 初始因子为1.0
        let mut i = 1; // 从第二天开始计算

        while (i < lease_days) {
            // 计算当前因子
            factor = factor * ratio / base;

            // 如果因子低于最低值(1/10)，则使用最低值
            if (factor < min_daily_factor) {
                // 增加(租赁天数-i)天的最低价格
                total_price = total_price + daily_price * min_daily_factor * (lease_days - i) / base;
                break
            };

            // 否则增加当前因子对应的价格
            total_price = total_price + daily_price * factor / base;
            i = i + 1;
        };

        total_price
    }
}