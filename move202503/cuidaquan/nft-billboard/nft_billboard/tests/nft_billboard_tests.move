#[test_only]
module nft_billboard::nft_billboard_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock;
    use sui::transfer;
    use std::string;
    use std::vector;

    // 导入特殊的one_time_witness模块，用于测试使用
    use nft_billboard::nft_billboard;
    use nft_billboard::factory::{Self, Factory};
    use nft_billboard::ad_space::{Self, AdSpace};
    use nft_billboard::nft::{Self, AdBoardNFT};

    // 测试账户
    const ADMIN: address = @0xA;
    const GAME_DEV: address = @0xB;
    const BUYER: address = @0xC;

    // 测试参数
    const DAILY_PRICE: u64 = 1_000_000_000; // 1 SUI
    const LEASE_DAYS: u64 = 30; // 租期30天
    const TEST_PAYMENT: u64 = 50_000_000_000; // 50 SUI

    // Billboard NFT的one-time witness类型
    public struct NFT_BILLBOARD has drop {}

    // 初始化函数
    fun init_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);

        // 初始化
        {
            // 手动执行初始化步骤
            ts::next_tx(&mut scenario, ADMIN);
            {
                // 初始化工厂
                factory::init_factory(ts::ctx(&mut scenario));
            };
        };

        scenario
    }

    #[test]
    fun test_system_initialization() {
        let mut scenario = init_test();

        // 验证工厂已被共享
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(ts::has_most_recent_shared<Factory>(), 0);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_register_game_dev() {
        let mut scenario = init_test();

        // 管理员注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 验证游戏开发者已注册
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let factory = ts::take_shared<Factory>(&scenario);
            assert!(factory::is_game_dev(&factory, GAME_DEV), 0);
            ts::return_shared(factory);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_create_ad_space() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 验证广告位创建成功
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ad_space = ts::take_shared<AdSpace>(&scenario);
            assert!(ad_space::is_available(&ad_space), 0);
            ts::return_shared(ad_space);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_purchase_ad_space() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 为买家创建资金
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(TEST_PAYMENT, ts::ctx(&mut scenario));
            transfer::public_transfer(coin, BUYER);
        };

        // 买家购买广告位
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            nft_billboard::purchase_ad_space(
                &mut factory,
                &mut ad_space,
                payment,
                string::utf8(b"TestBrand"),
                string::utf8(b"https://example.com/ad.jpg"),
                string::utf8(b"https://example.com"),
                LEASE_DAYS,
                &clock,
                0, // 立即开始
                vector::empty<u8>(), // 空的blob_id，表示没有使用Walrus
                string::utf8(b"external"), // 使用外部URL
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
            ts::return_shared(ad_space);
        };

        // 验证买家收到NFT
        ts::next_tx(&mut scenario, BUYER);
        {
            assert!(ts::has_most_recent_for_sender<AdBoardNFT>(&scenario), 0);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_update_ad_content() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 为买家创建资金
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(TEST_PAYMENT, ts::ctx(&mut scenario));
            transfer::public_transfer(coin, BUYER);
        };

        // 买家购买广告位
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            nft_billboard::purchase_ad_space(
                &mut factory,
                &mut ad_space,
                payment,
                string::utf8(b"TestBrand"),
                string::utf8(b"https://example.com/ad.jpg"),
                string::utf8(b"https://example.com"),
                LEASE_DAYS,
                &clock,
                0, // 立即开始
                vector::empty<u8>(), // 空的blob_id，表示没有使用Walrus
                string::utf8(b"external"), // 使用外部URL
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
            ts::return_shared(ad_space);
        };

        // 买家更新广告内容
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut nft = ts::take_from_sender<AdBoardNFT>(&scenario);

            nft_billboard::update_ad_content(
                &mut nft,
                string::utf8(b"https://example.com/new_ad.jpg"),
                vector::empty<u8>(), // 空的blob_id，表示没有使用Walrus
                string::utf8(b"external"), // 使用外部URL
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, nft);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_update_platform_ratio() {
        let mut scenario = init_test();

        // 管理员更新平台分成比例
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::update_platform_ratio(
                &mut factory,
                20, // 更新为20%
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 验证平台分成比例已更新
        ts::next_tx(&mut scenario, ADMIN);
        {
            let factory = ts::take_shared<Factory>(&scenario);
            assert!(factory::get_platform_ratio(&factory) == 20, 0);
            ts::return_shared(factory);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_ad_space_price() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 游戏开发者更新广告位价格
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);

            nft_billboard::update_ad_space_price(
                &mut ad_space,
                DAILY_PRICE * 2, // 翻倍价格
                ts::ctx(&mut scenario)
            );

            ts::return_shared(ad_space);
        };

        // 验证广告位价格已更新
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ad_space = ts::take_shared<AdSpace>(&scenario);
            assert!(ad_space::get_fixed_price(&ad_space) == DAILY_PRICE * 2, 0);
            ts::return_shared(ad_space);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_remove_game_dev() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 验证游戏开发者已注册
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let factory = ts::take_shared<Factory>(&scenario);
            assert!(factory::is_game_dev(&factory, GAME_DEV), 0);
            ts::return_shared(factory);
        };

        // 管理员移除游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::remove_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 验证游戏开发者已被移除
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let factory = ts::take_shared<Factory>(&scenario);
            assert!(!factory::is_game_dev(&factory, GAME_DEV), 0);
            ts::return_shared(factory);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = factory::EGameDevNotFound)]
    fun test_remove_nonexistent_game_dev() {
        let mut scenario = init_test();

        // 管理员尝试移除不存在的游戏开发者，预期失败
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::remove_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = nft_billboard::ENotAdmin)]
    fun test_remove_game_dev_not_admin() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 非管理员尝试移除游戏开发者，预期失败
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::remove_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_renew_lease() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 为买家创建资金
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(TEST_PAYMENT * 2, ts::ctx(&mut scenario));
            transfer::public_transfer(coin, BUYER);
        };

        // 买家购买广告位
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            nft_billboard::purchase_ad_space(
                &mut factory,
                &mut ad_space,
                payment,
                string::utf8(b"TestBrand"),
                string::utf8(b"https://example.com/ad.jpg"),
                string::utf8(b"https://example.com"),
                LEASE_DAYS,
                &clock,
                0, // 立即开始
                vector::empty<u8>(), // 空的blob_id，表示没有使用Walrus
                string::utf8(b"external"), // 使用外部URL
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
            ts::return_shared(ad_space);
        };

        // 修改：不再设置时钟到过期后的时间
        // 在NFT仍然有效期内进行续租
        // 偏移时间为原租期的一半
        let lease_seconds = LEASE_DAYS * 24 * 60 * 60;
        clock::increment_for_testing(&mut clock, lease_seconds * 500); // 租期的一半时间

        // 买家续租广告位
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let mut nft = ts::take_from_sender<AdBoardNFT>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            nft_billboard::renew_lease(
                &mut factory,
                &mut ad_space,
                &mut nft,
                payment,
                LEASE_DAYS,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
            ts::return_shared(ad_space);
            ts::return_to_sender(&scenario, nft);
        };

        // 验证续租后的NFT状态
        ts::next_tx(&mut scenario, BUYER);
        {
            let nft = ts::take_from_sender<AdBoardNFT>(&scenario);
            assert!(nft::get_lease_status(&nft, &clock), 0);
            ts::return_to_sender(&scenario, nft);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_delete_ad_space() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 验证广告位创建成功
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ad_space = ts::take_shared<AdSpace>(&scenario);
            assert!(ad_space::is_available(&ad_space), 0);
            ts::return_shared(ad_space);
        };

        // 游戏开发者删除广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let ad_space = ts::take_shared<AdSpace>(&scenario);

            nft_billboard::delete_ad_space(
                &mut factory,
                ad_space,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 验证广告位已被删除（不存在共享对象）
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(!ts::has_most_recent_shared<AdSpace>(), 0);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = nft_billboard::ENotAdSpaceCreator)]
    fun test_delete_ad_space_not_creator() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 非创建者尝试删除广告位，预期失败
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let ad_space = ts::take_shared<AdSpace>(&scenario);

            // 这里会失败并中止测试，所以不需要返回对象
            nft_billboard::delete_ad_space(
                &mut factory,
                ad_space,
                ts::ctx(&mut scenario)
            );

            // 由于上面的调用会失败，以下代码不会执行
            // 因此不需要返回ad_space (ad_space已经被移动)
            ts::return_shared(factory);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_update_and_delete_ad_space() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 游戏开发者更新广告位价格
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);

            nft_billboard::update_ad_space_price(
                &mut ad_space,
                DAILY_PRICE * 3, // 更新为三倍价格
                ts::ctx(&mut scenario)
            );

            ts::return_shared(ad_space);
        };

        // 验证广告位价格已更新
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ad_space = ts::take_shared<AdSpace>(&scenario);
            assert!(ad_space::get_fixed_price(&ad_space) == DAILY_PRICE * 3, 0);
            ts::return_shared(ad_space);
        };

        // 游戏开发者删除广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let ad_space = ts::take_shared<AdSpace>(&scenario);

            nft_billboard::delete_ad_space(
                &mut factory,
                ad_space,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 验证广告位已被删除
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(!ts::has_most_recent_shared<AdSpace>(), 0);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = nft_billboard::ENftExpired)]
    fun test_renew_expired_lease() {
        let mut scenario = init_test();

        // 注册游戏开发者
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            nft_billboard::register_game_dev(&mut factory, GAME_DEV, ts::ctx(&mut scenario));
            ts::return_shared(factory);
        };

        // 创建时钟
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // 游戏开发者创建广告位
        ts::next_tx(&mut scenario, GAME_DEV);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);

            nft_billboard::create_ad_space(
                &mut factory,
                string::utf8(b"Game123"),
                string::utf8(b"Lobby"),
                string::utf8(b"16:9"),
                DAILY_PRICE,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
        };

        // 为买家创建资金
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(TEST_PAYMENT * 2, ts::ctx(&mut scenario));
            transfer::public_transfer(coin, BUYER);
        };

        // 买家购买广告位
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            nft_billboard::purchase_ad_space(
                &mut factory,
                &mut ad_space,
                payment,
                string::utf8(b"TestBrand"),
                string::utf8(b"https://example.com/ad.jpg"),
                string::utf8(b"https://example.com"),
                LEASE_DAYS,
                &clock,
                0, // 立即开始
                vector::empty<u8>(), // 空的blob_id，表示没有使用Walrus
                string::utf8(b"external"), // 使用外部URL
                ts::ctx(&mut scenario)
            );

            ts::return_shared(factory);
            ts::return_shared(ad_space);
        };

        // 设置时钟到期后的时间
        let lease_seconds = LEASE_DAYS * 24 * 60 * 60;
        clock::increment_for_testing(&mut clock, lease_seconds * 1000 + 1000); // 加1秒确保过期

        // 买家尝试续租已过期的广告位，预期失败
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut factory = ts::take_shared<Factory>(&scenario);
            let mut ad_space = ts::take_shared<AdSpace>(&scenario);
            let mut nft = ts::take_from_sender<AdBoardNFT>(&scenario);
            let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

            // 这个调用应该失败，因为NFT已过期
            nft_billboard::renew_lease(
                &mut factory,
                &mut ad_space,
                &mut nft,
                payment,
                LEASE_DAYS,
                &clock,
                ts::ctx(&mut scenario)
            );

            // 以下代码不会执行，因为上面的调用会失败
            ts::return_shared(factory);
            ts::return_shared(ad_space);
            ts::return_to_sender(&scenario, nft);
        };

        // 清理
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}