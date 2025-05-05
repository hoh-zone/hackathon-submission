# NFT Billboards - 链上动态NFT广告牌系统

## 项目推介文档

[NFT Billboards - 重新定义区块链广告的未来](https://docs.google.com/presentation/d/1p4-J6uv0tInVwv_JEsSo3fC_VnMLQBheGqZY2nNObx0/edit?usp=sharing)

## 项目概述

NFT Billboards是一个革命性的区块链广告解决方案，将虚拟世界中的广告位转化为可交易的NFT资产。我们利用Sui区块链的对象模型，结合Walrus去中心化存储网络，实现了广告内容的动态更新和安全存储。此广告牌系统适配包括链游、元宇宙、Web3应用等多种虚拟世界场景。

### 核心价值

- **广告位NFT化**：将广告资源转化为区块链上的唯一资产
- **动态内容更新**：无需重新部署即可更新广告内容
- **透明租赁机制**：基于智能合约的自动化租赁和续租流程
- **去中心化存储**：利用Walrus网络实现广告内容的安全存储

## 系统架构

项目采用三层架构设计：

1. **智能合约层**：基于Sui区块链的Move智能合约，处理核心业务逻辑
2. **前端应用层**：React + TypeScript构建的用户界面，提供直观的交互体验
3. **存储层**：Walrus去中心化存储网络，确保广告内容的安全可靠存储

## 目录结构

```
nft-billboard/
├── README.md                # 项目说明文档
├── nft_billboard/       # Move智能合约目录
│   ├── sources/             # 合约源码
│   │   ├── ad_space.move    # 广告位相关功能
│   │   ├── nft_billboard.move # 主合约模块
│   │   ├── factory.move     # 工厂合约
│   │   └── nft.move         # NFT相关功能
│   ├── tests/               # 合约测试
│   └── build/               # 编译输出
└── nft_billboard_web/   # 前端项目目录
    ├── src/                 # 前端源码
    │   ├── components/      # 组件
    │   ├── pages/           # 页面
    │   ├── hooks/           # 自定义钩子
    │   ├── utils/           # 工具函数
    │   └── assets/          # 静态资源
    └── public/              # 公共资源
```

## 核心功能

### 1. 广告位管理

- 平台管理员可注册游戏开发者
- 游戏开发者可创建和管理广告位
- 广告位包含位置、尺寸、价格等属性

### 2. NFT广告牌

- 用户可购买广告位获得NFT所有权
- 支持1-365天的灵活租期
- 智能定价算法确保长期租赁更具性价比

### 3. 内容管理

- NFT持有者可动态更新广告内容
- 内容存储在Walrus去中心化网络
- 所有更新记录在区块链上可追溯

### 4. 权限系统

- 多级权限控制确保系统安全
- 基于地址验证的访问控制
- 完善的错误处理机制

## 技术栈

- **区块链**：Sui
- **智能合约**：Move
- **前端框架**：React 18 + TypeScript
- **UI组件**：Ant Design
- **钱包集成**：@mysten/dapp-kit
- **存储方案**：Walrus

## 快速开始

### 智能合约

```bash
# 进入合约目录
cd nft_billboard

# 编译合约
sui move build

# 运行测试
sui move test

# 发布合约
sui client publish --gas-budget 100000000
```

### 前端应用

```bash
# 安装依赖
cd nft_billboard_web
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```



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

## 智能定价算法

系统采用指数衰减模型计算租赁价格，确保长期租赁更具性价比：

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

## 前端页面

- **首页**：系统介绍和功能导航
- **广告位列表**：浏览和筛选可用广告位
- **广告位详情**：查看广告位详细信息和购买
- **我的NFT**：管理已购买的广告牌NFT
- **管理页面**：开发者和管理员专用功能

## 安全考虑

- 基于地址的多级权限验证
- 租约有效性验证
- 支付金额验证和多余资金退还
- 内容哈希验证确保内容完整性

## 部署指南

### 合约部署

1. 确保安装Sui CLI并配置好钱包
2. 编译并发布合约到测试网或主网
3. 记录合约包ID和工厂对象ID

### 前端部署

1. 在环境配置文件(.env.production)中设置合约相关参数
2. 构建前端应用：`npm run build`
3. 部署到静态网站托管服务

## 后续规划

1. 广告效果分析功能
2. 更多广告类型支持
3. 多链部署支持
4. 移动端优化
5. 社区治理机制