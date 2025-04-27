module hashcat_insurance::insurance_nft {
    // 导入必要的模块
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};
    use sui::event;
    use std::string::{Self, String};

    // 定义 NFT 类型
    // 包含基本信息和元数据
    struct InsuranceNFT has key, store {
        id: UID,                    // NFT 的唯一标识符
        name: String,               // NFT 名称
        description: String,        // NFT 描述
        url: Url,                   // NFT 图片 URL（GitHub 头像）
        creator: address,           // 创建者地址
        created_at: u64,            // 创建时间戳
    }

    // 定义事件类型
    // 用于记录 NFT 的创建事件
    struct NFTMintedEvent has copy, drop {
        nft_id: ID,                 // NFT 的 ID
        creator: address,           // 创建者地址
        recipient: address,         // 接收者地址
        name: String,               // NFT 名称
    }

    // 初始化函数
    // 在合约部署时调用
    fun init(ctx: &mut TxContext) {
        // 合约初始化逻辑
    }

    // 铸造 NFT 函数
    // 可以指定接收者地址
    public fun mint(
        name: vector<u8>,           // NFT 名称（字节数组）
        description: vector<u8>,    // NFT 描述（字节数组）
        recipient: address,         // 接收者地址
        ctx: &mut TxContext         // 交易上下文
    ): ID {
        // 创建 NFT 对象
        let nft = InsuranceNFT {
            id: object::new(ctx),   // 生成新的 UID
            name: string::utf8(name), // 将字节数组转换为字符串
            description: string::utf8(description), // 将字节数组转换为字符串
            url: url::new_unsafe_from_bytes(b"https://avatars.githubusercontent.com/u/93503087"), // 创建 URL 对象
            creator: tx_context::sender(ctx), // 设置创建者地址
            created_at: tx_context::epoch(ctx), // 设置创建时间
        };

        let nft_id = object::id(&nft);

        // 发出铸造事件
        event::emit(NFTMintedEvent {
            nft_id,
            creator: tx_context::sender(ctx),
            recipient,
            name: nft.name,
        });

        // 转移 NFT 给接收者
        transfer::public_transfer(nft, recipient);
        
        nft_id
    }

    // 获取 NFT 名称
    public fun name(nft: &InsuranceNFT): &String {
        &nft.name
    }

    // 获取 NFT 描述
    public fun description(nft: &InsuranceNFT): &String {
        &nft.description
    }

    // 获取 NFT URL
    public fun url(nft: &InsuranceNFT): &Url {
        &nft.url
    }
} 