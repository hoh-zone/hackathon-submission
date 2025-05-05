module nft_billboard::nft {
    use std::string::{String, utf8};
    use std::option::{Self, Option, some, none};
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::display;
    use sui::package;

    use nft_billboard::ad_space::AdSpace;

    // 一次性见证类型 - 添加public可见性
    public struct NFT has drop {}

    // 添加模块初始化函数
    fun init(witness: NFT, ctx: &mut TxContext) {
        let keys = vector[
            utf8(b"name"),
            utf8(b"description"),
            utf8(b"image_url"),
            utf8(b"project_url"),
            utf8(b"creator"),
            utf8(b"brand_name"),
            utf8(b"lease_start"),
            utf8(b"lease_end"),
            utf8(b"status"),
            // 新增Walrus相关字段
            utf8(b"blob_id"),
            utf8(b"storage_source")
        ];

        let values = vector[
            utf8(b"{brand_name} - Billboard Ad"),
            utf8(b"A digital billboard advertisement space in the metaverse"),
            utf8(b"{content_url}"),
            utf8(b"{project_url}"),
            utf8(b"{creator}"),
            utf8(b"{brand_name}"),
            utf8(b"{lease_start}"),
            utf8(b"{lease_end}"),
            utf8(b"{is_active}"),
            // 新增Walrus相关值
            utf8(b"{blob_id}"),
            utf8(b"{storage_source}")
        ];

        // 正确使用一次性见证
        let publisher = package::claim(witness, ctx);
        let mut display = display::new_with_fields<AdBoardNFT>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // 错误码
    const ENotOwner: u64 = 1;
    const ELeaseExpired: u64 = 2;
    const EInvalidLeaseDuration: u64 = 3;

    // 定义租期常量
    const SECONDS_PER_DAY: u64 = 24 * 60 * 60;
    const MAX_LEASE_DAYS: u64 = 365; // 最大租期365天
    const MIN_LEASE_DAYS: u64 = 1;   // 最小租期1天

    // 广告牌NFT结构 - 添加blob_id和storage_source字段
    public struct AdBoardNFT has key, store {
        id: UID,
        ad_space_id: ID,           // 对应的广告位ID
        owner: address,            // 当前所有者
        brand_name: String,        // 品牌名称
        content_url: String,       // 内容URL或指针
        project_url: String,       // 项目URL
        lease_start: u64,          // 租约开始时间
        lease_end: u64,            // 租约结束时间
        is_active: bool,           // 是否激活
        blob_id: Option<String>,   // Walrus中的blob ID
        storage_source: String,    // 存储来源 ("walrus" 或 "external")
    }

    // 事件定义 - 扩展事件添加blob_id字段
    public struct AdContentUpdated has copy, drop {
        nft_id: ID,
        content_url: String,
        updated_by: address,
        blob_id: Option<String>,   // 添加blob_id字段
        storage_source: String     // 添加storage_source字段
    }

    public struct AdStatusUpdated has copy, drop {
        nft_id: ID,
        is_active: bool,
        updated_by: address
    }

    public struct LeaseRenewed has copy, drop {
        nft_id: ID,
        renewed_by: address,
        lease_end: u64,
        price: u64,
        blob_id: Option<String>    // 添加blob_id字段
    }

    // 创建NFT - 添加blob_id和storage_source参数
    public fun create_nft(
        ad_space: &AdSpace,
        brand_name: String,
        content_url: String,
        project_url: String,
        lease_duration: u64,
        start_time: u64,
        blob_id: Option<String>,   // 添加blob_id参数
        storage_source: String,    // 添加storage_source参数
        clock: &Clock,
        ctx: &mut TxContext
    ): AdBoardNFT {
        assert!(lease_duration >= MIN_LEASE_DAYS && lease_duration <= MAX_LEASE_DAYS, EInvalidLeaseDuration);
        
        let nft = AdBoardNFT {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            ad_space_id: object::id(ad_space),
            brand_name,
            content_url,
            project_url,
            lease_start: if (start_time == 0) { clock::timestamp_ms(clock) / 1000 } else { start_time },
            lease_end: if (start_time == 0) {
                (clock::timestamp_ms(clock) / 1000) + (lease_duration * SECONDS_PER_DAY)
            } else {
                start_time + (lease_duration * SECONDS_PER_DAY)
            },
            is_active: true,
            blob_id,
            storage_source
        };

        nft
    }

    // 更新广告内容 - 添加blob_id和storage_source参数
    public fun update_content(
        nft: &mut AdBoardNFT,
        content_url: String,
        blob_id: Option<String>,   // 添加blob_id参数
        storage_source: String,    // 添加storage_source参数
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == nft.owner, ENotOwner);
        assert!(clock::timestamp_ms(clock) / 1000 <= nft.lease_end, ELeaseExpired);
        
        nft.content_url = content_url;
        nft.blob_id = blob_id;
        nft.storage_source = storage_source;
        
        event::emit(AdContentUpdated {
            nft_id: object::id(nft),
            content_url,
            updated_by: tx_context::sender(ctx),
            blob_id,
            storage_source
        });
    }

    // 设置广告活跃状态
    public fun set_active_status(
        nft: &mut AdBoardNFT,
        is_active: bool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == nft.owner, ENotOwner);
        
        nft.is_active = is_active;
        
        event::emit(AdStatusUpdated {
            nft_id: object::id(nft),
            is_active,
            updated_by: tx_context::sender(ctx)
        });
    }

    // 续租广告位
    public fun renew_lease(
        nft: &mut AdBoardNFT,
        lease_duration: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == nft.owner, ENotOwner);
        assert!(lease_duration >= MIN_LEASE_DAYS && lease_duration <= MAX_LEASE_DAYS, EInvalidLeaseDuration);
        
        nft.lease_end = nft.lease_end + (lease_duration * SECONDS_PER_DAY);
        
        event::emit(LeaseRenewed {
            nft_id: object::id(nft),
            renewed_by: tx_context::sender(ctx),
            lease_end: nft.lease_end,
            price: lease_duration * SECONDS_PER_DAY,
            blob_id: nft.blob_id  // 添加blob_id字段
        });
    }

    // Getter 函数
    public fun is_active(nft: &AdBoardNFT): bool {
        nft.is_active
    }

    public fun get_lease_status(nft: &AdBoardNFT, clock: &Clock): bool {
        clock::timestamp_ms(clock) / 1000 <= nft.lease_end
    }

    public fun get_owner(nft: &AdBoardNFT): address {
        nft.owner
    }

    public fun get_ad_space_id(nft: &AdBoardNFT): ID {
        nft.ad_space_id
    }
    
    
    // 转移NFT
    public fun transfer_nft(nft: AdBoardNFT, recipient: address) {
        transfer::transfer(nft, recipient)
    }

    #[test_only]
    public fun init_display_for_testing(ctx: &mut TxContext) {
        // 在测试中跳过publisher和display的创建，因为它们在测试中不是必需的
        // 这里只是为了让测试能够继续运行
    }
} 