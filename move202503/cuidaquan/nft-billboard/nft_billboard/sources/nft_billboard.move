module nft_billboard::nft_billboard {
    use sui::object::UID;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::Clock;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    use nft_billboard::ad_space::{Self, AdSpace};
    use nft_billboard::nft;
    use nft_billboard::factory::{Self, Factory};

    // 错误码
    const EAdSpaceNotAvailable: u64 = 4;
    const EInvalidPayment: u64 = 5;
    const ENotAdmin: u64 = 7;    // 不是管理员
    const ENotGameDev: u64 = 8;  // 不是游戏开发者
    const ENotAdSpaceCreator: u64 = 9; // 不是广告位创建者
    const ENftExpired: u64 = 12; // NFT已过期

    // 一次性见证类型
    public struct NFT_BILLBOARD has drop {}

    // 事件
    public struct SystemInitialized has copy, drop {
        admin: address
    }

    public struct GameDevRegistered has copy, drop {
        game_dev: address
    }

    public struct GameDevRemoved has copy, drop {
        game_dev: address
    }

    public struct AdSpacePurchased has copy, drop {
        ad_space_id: address,
        buyer: address,
        brand_name: String,
        content_url: String,
        lease_days: u64
    }

    // 续租事件
    public struct LeaseRenewed has copy, drop {
        ad_space_id: address,
        nft_id: address,
        lease_days: u64
    }

    // 初始化函数
    fun init(_witness: NFT_BILLBOARD, ctx: &mut TxContext) {
        // 初始化工厂
        factory::init_factory(ctx);

        // 发送事件
        event::emit(SystemInitialized {
            admin: tx_context::sender(ctx)
        });
    }

    // 注册游戏开发者
    public entry fun register_game_dev(
        factory: &mut Factory,
        game_dev: address,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为管理员
        assert!(factory::get_admin(factory) == tx_context::sender(ctx), ENotAdmin);

        // 将开发者地址注册到Factory中
        factory::register_game_dev(factory, game_dev, ctx);

        // 发送事件
        event::emit(GameDevRegistered {
            game_dev
        });
    }

    // 移除游戏开发者
    public entry fun remove_game_dev(
        factory: &mut Factory,
        game_dev: address,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为管理员
        assert!(factory::get_admin(factory) == tx_context::sender(ctx), ENotAdmin);

        // 从Factory中移除开发者地址
        factory::remove_game_dev(factory, game_dev, ctx);

        // 发送事件
        event::emit(GameDevRemoved {
            game_dev
        });
    }

    // 游戏开发商创建广告位
    public entry fun create_ad_space(
        factory: &mut Factory,
        game_id: String,
        location: String,
        size: String,
        daily_price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为已注册的游戏开发者
        assert!(factory::is_game_dev(factory, tx_context::sender(ctx)), ENotGameDev);

        // 创建广告位
        let ad_space = ad_space::create_ad_space(
            game_id,
            location,
            size,
            daily_price,
            tx_context::sender(ctx),
            clock,
            ctx
        );

        // 注册广告位到工厂
        factory::register_ad_space(
            factory,
            object::id(&ad_space),
            tx_context::sender(ctx)
        );

        // 共享广告位对象
        ad_space::share_ad_space(ad_space);
    }

    // 更新平台分成比例
    public entry fun update_platform_ratio(
        factory: &mut Factory,
        platform_ratio: u8,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为管理员
        assert!(factory::get_admin(factory) == tx_context::sender(ctx), ENotAdmin);
        
        factory::update_ratios(factory, platform_ratio, ctx)
    }

    // 更新广告位价格
    public entry fun update_ad_space_price(
        ad_space: &mut AdSpace,
        daily_price: u64,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为广告位创建者
        assert!(ad_space::get_creator(ad_space) == tx_context::sender(ctx), ENotAdSpaceCreator);
        
        ad_space::update_price(ad_space, daily_price, ctx)
    }

    // 删除广告位
    public entry fun delete_ad_space(
        factory: &mut Factory,
        ad_space: AdSpace,
        ctx: &mut TxContext
    ) {
        // 验证调用者是否为广告位创建者
        assert!(ad_space::get_creator(&ad_space) == tx_context::sender(ctx), ENotAdSpaceCreator);
        
        // 从工厂中移除广告位
        factory::remove_ad_space(factory, object::id(&ad_space), ctx);
        
        // 删除广告位对象
        ad_space::delete_ad_space(ad_space, ctx);
    }

    // 购买广告位并创建NFT - 添加blob_id和storage_source参数
    public entry fun purchase_ad_space(
        factory: &mut Factory,
        ad_space: &mut AdSpace,
        mut payment: Coin<SUI>,
        brand_name: String,
        content_url: String,
        project_url: String,
        lease_days: u64,
        clock: &Clock,
        start_time: u64,
        blob_id: vector<u8>,      // 添加：blob_id参数（序列化后的Option<String>）
        storage_source: String,   // 添加：storage_source参数
        ctx: &mut TxContext
    ) {
        // 验证广告位是否可用
        assert!(ad_space::is_available(ad_space), EAdSpaceNotAvailable);

        // 获取广告位租赁价格
        let price = ad_space::calculate_lease_price(ad_space, lease_days);

        // 验证支付金额
        assert!(coin::value(&payment) >= price, EInvalidPayment);

        // 如果支付金额超过价格，先退还超出部分
        if (coin::value(&payment) > price) {
            let payment_value = coin::value(&payment);
            let refund = coin::split(&mut payment, payment_value - price, ctx);
            transfer::public_transfer(refund, tx_context::sender(ctx));
        };

        // 获取平台分成比例
        let platform_ratio = factory::get_platform_ratio(factory);

        // 计算分成金额
        let platform_amount = (price * (platform_ratio as u64)) / 100;
        let game_dev_amount = price - platform_amount; // 剩余金额都给游戏开发者

        // 分配支付金额
        let platform_payment = coin::split(&mut payment, platform_amount, ctx);
        let game_dev_payment = coin::split(&mut payment, game_dev_amount, ctx);

        // 销毁可能的零值 Coin
        coin::destroy_zero(payment);

        // 将平台收入转给平台管理员
        transfer::public_transfer(platform_payment, factory::get_admin(factory));

        // 转账给游戏开发者
        transfer::public_transfer(game_dev_payment, ad_space::get_creator(ad_space));

        // 解析blob_id参数
        let blob_id_option = if (vector::is_empty(&blob_id)) {
            option::none()
        } else {
            option::some(string::utf8(blob_id))
        };

        // 创建NFT - 添加blob_id和storage_source参数
        let nft = nft::create_nft(
            ad_space,
            brand_name,
            content_url,
            project_url,
            lease_days,
            start_time,
            blob_id_option,     // 传递blob_id
            storage_source,     // 传递storage_source
            clock,
            ctx
        );

        // 将NFT ID添加到对应广告位条目
        factory::add_nft_to_ad_space(factory, object::id(ad_space), object::id(&nft));

        // 发送事件
        event::emit(AdSpacePurchased {
            ad_space_id: object::id_address(ad_space),
            buyer: tx_context::sender(ctx),
            brand_name,
            content_url,
            lease_days
        });

        // 转移NFT给买家
        transfer::public_transfer(nft, tx_context::sender(ctx));
    }

    // 更新广告内容 - 添加blob_id和storage_source参数
    public entry fun update_ad_content(
        nft: &mut nft::AdBoardNFT,
        content_url: String,
        blob_id: vector<u8>,      // 添加：blob_id参数（序列化后的Option<String>）
        storage_source: String,   // 添加：storage_source参数
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 解析blob_id参数
        let blob_id_option = if (vector::is_empty(&blob_id)) {
            option::none()
        } else {
            option::some(string::utf8(blob_id))
        };

        // 调用nft模块的更新函数，传递blob_id和storage_source
        nft::update_content(nft, content_url, blob_id_option, storage_source, clock, ctx)
    }

    // 暴露广告位价格计算接口
    public entry fun calculate_lease_price(
        ad_space: &AdSpace,
        lease_days: u64
    ): u64 {
        ad_space::calculate_lease_price(ad_space, lease_days)
    }

    // 续租广告位
    public entry fun renew_lease(
        factory: &mut Factory,
        ad_space: &mut AdSpace,
        nft: &mut nft::AdBoardNFT,
        mut payment: Coin<SUI>,
        lease_days: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 修改验证逻辑：要求NFT未过期才能续租
        // 原来：assert!(!nft::get_lease_status(nft, clock), ENotExpired);
        // get_lease_status为true表示NFT仍然有效，为false表示已过期
        assert!(nft::get_lease_status(nft, clock), ENftExpired);

        // 获取广告位租赁价格
        let price = ad_space::calculate_lease_price(ad_space, lease_days);

        // 验证支付金额
        assert!(coin::value(&payment) >= price, EInvalidPayment);

        // 如果支付金额超过价格，先退还超出部分
        if (coin::value(&payment) > price) {
            let payment_value = coin::value(&payment);
            let refund = coin::split(&mut payment, payment_value - price, ctx);
            transfer::public_transfer(refund, tx_context::sender(ctx));
        };

        // 获取平台分成比例
        let platform_ratio = factory::get_platform_ratio(factory);

        // 计算分成金额
        let platform_amount = (price * (platform_ratio as u64)) / 100;
        let game_dev_amount = price - platform_amount; // 剩余金额都给游戏开发者

        // 分配支付金额
        let platform_payment = coin::split(&mut payment, platform_amount, ctx);
        let game_dev_payment = coin::split(&mut payment, game_dev_amount, ctx);

        // 销毁可能的零值 Coin
        coin::destroy_zero(payment);

        // 将平台收入转给平台管理员
        transfer::public_transfer(platform_payment, factory::get_admin(factory));

        // 转账给游戏开发者
        transfer::public_transfer(game_dev_payment, ad_space::get_creator(ad_space));

        // 更新NFT的租赁期限
        nft::renew_lease(nft, lease_days, clock, ctx);

        // 发送续租事件
        event::emit(LeaseRenewed {
            ad_space_id: object::id_address(ad_space),
            nft_id: object::id_address(nft),
            lease_days
        });
    }

    #[test_only]
    public fun register_game_dev_for_testing(
        factory: &mut Factory,
        game_dev: address,
        ctx: &mut TxContext
    ) {
        // 将开发者地址注册到Factory中
        factory::register_game_dev(factory, game_dev, ctx);

        // 发送事件
        event::emit(GameDevRegistered {
            game_dev
        });
    }
}
