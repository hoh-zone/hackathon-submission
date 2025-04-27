module hashcat_coin::test_sui {
    // 导入必要的模块
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option;

    // 定义 TEST_SUI 类型，用于初始化
    struct TEST_SUI has drop {}

    // 初始化函数，在合约部署时调用
    // 创建代币，设置精度为6，并设置代币的元数据
    // 将代币元数据冻结，将铸造权限转移给部署者
    fun init(witness: TEST_SUI, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness, 
            6,  // 代币精度
            b"testSUI",  // 代币名称
            b"testSUI",  // 代币符号
            b"testSUI",  // 代币描述
            option::none(),    // 代币图标（可选）
            ctx
        );
        // 冻结元数据，防止修改
        transfer::public_freeze_object(metadata);
        // 将铸造权限转移给部署者
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }

    // 铸造代币函数
    // 只有拥有 TreasuryCap 的地址才能调用此函数
    // 可以指定接收者地址
    public entry fun mint(
        cap: &mut TreasuryCap<TEST_SUI>,  // 铸造权限
        value: u64,                      // 铸造数量
        receiver: address,               // 接收者地址
        ctx: &mut TxContext             // 交易上下文
    ) {
        // 铸造代币
        let mint_coin = coin::mint(
            cap,
            value,
            ctx,
        );
        // 将铸造的代币转移给指定接收者
        transfer::public_transfer(mint_coin, receiver);
    }
}
