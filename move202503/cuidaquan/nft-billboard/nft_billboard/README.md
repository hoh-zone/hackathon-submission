# NFT Billboard 智能合约

## 概述

这是NFT Billboard系统的智能合约部分，使用Sui区块链的Move语言实现。合约实现了广告位NFT化、租赁管理、内容动态更新等核心功能。

## 合约结构

项目包含四个主要合约模块：

1. **nft_billboard.move** - 主合约模块，包含系统初始化和核心功能
2. **factory.move** - 工厂合约，负责权限管理和广告位创建
3. **ad_space.move** - 广告位相关功能，包括创建和管理广告位
4. **nft.move** - NFT相关功能，包括NFT铸造、内容更新和租约管理

## 核心数据结构

### 工厂合约

```move
public struct Factory has key {
    id: UID,
    admin: address,
    ad_spaces: vector<AdSpaceEntry>,  // 改为vector<AdSpaceEntry>，更容易在JSON中显示
    game_devs: vector<address>, // 游戏开发者地址列表
    platform_ratio: u8   // 平台分成比例，百分比
}
```

### 广告位

```move
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
```

### 广告牌NFT

```move
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
```

## 主要功能

### 1. 系统初始化

```move
fun init(_: NFT_BILLBOARD, ctx: &mut TxContext)
```

初始化系统，创建工厂合约，设置平台管理员和系统参数。

### 2. 注册游戏开发者

```move
public entry fun register_game_dev(
    factory: &mut Factory,
    game_dev: address,
    ctx: &mut TxContext
)
```

平台管理员注册游戏开发者，授予其创建广告位的权限。

### 3. 创建广告位

```move
public entry fun create_ad_space(
    factory: &mut Factory,
    game_id: String,
    location: String,
    size: String,
    daily_price: u64,
    clock: &Clock,
    ctx: &mut TxContext
) 
```

游戏开发者创建新的广告位，设置位置、尺寸和价格等属性。

### 4. 购买广告位

```move
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
)
```

用户购买广告位，支付SUI代币，获得对应的NFT所有权。

### 5. 更新广告内容

```move
public entry fun update_ad_content(
    nft: &mut nft::AdBoardNFT,
    content_url: String,
    blob_id: vector<u8>,      // 添加：blob_id参数（序列化后的Option<String>）
    storage_source: String,   // 添加：storage_source参数
    clock: &Clock,
    ctx: &mut TxContext
)
```

NFT持有者更新广告内容，内容URL和哈希记录在区块链上。

### 6. 续租广告位

```move
public entry fun renew_lease(
    factory: &mut Factory,
    ad_space: &mut AdSpace,
    nft: &mut nft::AdBoardNFT,
    mut payment: Coin<SUI>,
    lease_days: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

NFT持有者续租广告位，延长租约期限。

## 智能定价算法

系统使用指数衰减模型计算租赁价格，确保长期租赁更具性价比：

```move
// 价格计算核心逻辑
let daily_price = ad_space.fixed_price;
let ratio = 977000; // 衰减因子(0.977)
let base = 1000000; // 基数
let min_daily_factor = 500000; // 最低日因子(0.5)

// 计算总价
let total_price = daily_price; // 第一天全价
let mut factor = base;
let mut i = 1;

while (i < lease_days) {
    factor = factor * ratio / base;
    
    if (factor < min_daily_factor) {
        total_price = total_price + daily_price * min_daily_factor * (lease_days - i) / base;
        break
    };
    
    total_price = total_price + daily_price * factor / base;
    i = i + 1;
}
```

## 权限控制

系统实现了多级权限控制：

1. **管理员权限**：验证调用者地址与Factory中的admin地址匹配
2. **游戏开发者权限**：验证调用者地址是否在game_devs表中注册
3. **NFT所有者权限**：验证调用者地址与NFT所有者地址匹配

## 错误处理

合约定义了多种错误类型，确保操作安全：

- `ENotAdmin`：非管理员操作错误
- `ENotGameDev`：非游戏开发者操作错误
- `ENotAdSpaceCreator`：非广告位创建者操作错误
- `ENotOwner`：非NFT所有者操作错误
- `EInsufficientPayment`：支付金额不足错误
- `ELeaseExpired`：租约已过期错误

## 编译与测试

```bash
# 编译合约
sui move build

# 运行测试
sui move test

# 发布合约
sui client publish --gas-budget 100000000
```

## 部署后配置

部署合约后，需要记录以下信息用于前端配置：

1. 合约包ID
2. 工厂对象ID

这些信息将在前端环境变量中配置，用于与合约交互。
