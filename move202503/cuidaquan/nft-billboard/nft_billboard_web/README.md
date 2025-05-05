# NFT Billboards - 前端应用

## 概述

NFT Billboards前端应用是一个基于React和TypeScript构建的现代化Web应用，为用户提供直观的界面来浏览、购买和管理区块链广告位NFT。该应用与Sui区块链智能合约无缝集成，支持钱包连接、交易签名和NFT内容管理。

## 核心功能

- **广告位浏览与购买**：浏览可用广告位，查看详情并购买
- **NFT管理**：管理已购买的广告牌NFT，更新内容和续租
- **开发者工具**：游戏开发者可创建和管理广告位
- **管理员功能**：平台管理员可注册开发者和设置系统参数
- **钱包集成**：支持Sui钱包连接和交易签名
- **内容存储**：集成Walrus去中心化存储网络

## 技术栈

- **前端框架**：React 18 + TypeScript
- **UI组件库**：Ant Design
- **状态管理**：React Query + Context API
- **路由**：React Router
- **区块链交互**：@mysten/sui + @mysten/dapp-kit
- **样式**：SCSS
- **构建工具**：Vite

## 快速开始

### 环境要求

- Node.js 16+
- NPM 8+
- Sui钱包浏览器扩展

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

开发服务器将在 [http://localhost:3000](http://localhost:3000) 启动。

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 组件
│   ├── adSpace/     # 广告位相关组件
│   ├── common/      # 通用组件
│   ├── layout/      # 布局组件
│   ├── nft/         # NFT相关组件
│   └── walrus/      # Walrus存储相关组件
├── config/          # 配置文件
├── hooks/           # 自定义钩子
├── pages/           # 页面组件
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
│   ├── auth.ts      # 权限验证
│   ├── contract.ts  # 合约交互
│   ├── env.ts       # 环境配置工具
│   └── format.ts    # 数据格式化
└── App.tsx          # 应用入口
```

## 主要页面

- **首页 (Home.tsx)**：系统介绍和功能导航
- **广告位列表 (AdSpaces.tsx)**：浏览和筛选可用广告位
- **广告位详情 (AdSpaceDetail.tsx)**：查看广告位详情和购买
- **我的NFT (MyNFTs.tsx)**：管理已购买的NFT
- **NFT详情 (NFTDetail.tsx)**：查看NFT详情和更新内容
- **管理页面 (Manage.tsx)**：开发者和管理员功能

## 环境配置

项目使用环境变量配置关键参数，支持开发和生产环境：

```
# .env.development / .env.production
REACT_APP_CONTRACT_PACKAGE_ID=0x...  # 合约包ID
REACT_APP_CONTRACT_MODULE_NAME=nft_billboard  # 合约模块名
REACT_APP_FACTORY_OBJECT_ID=0x...  # 工厂对象ID
REACT_APP_CLOCK_ID=0x6  # 时钟对象ID

# 网络配置
REACT_APP_DEFAULT_NETWORK=testnet  # mainnet, testnet

# 环境配置
REACT_APP_ENV=development/production  # 由npm脚本通过cross-env设置

# Walrus配置
REACT_APP_WALRUS_ENVIRONMENT=testnet
REACT_APP_WALRUS_AGGREGATOR_URL_MAINNET=https://walrus.globalstake.io/v1/blobs/by-object-id/
REACT_APP_WALRUS_AGGREGATOR_URL_TESTNET=https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/
```

使用`npm start`启动开发环境，使用`npm run build`构建生产环境。

## 网络支持

应用支持连接到多个Sui网络：

- **mainnet**：Sui主网
- **testnet**：Sui测试网

默认网络可通过环境变量`REACT_APP_DEFAULT_NETWORK`配置。

## 用户界面

### 广告位展示

- 卡片式布局展示广告位信息
- 支持多种尺寸规格：小(128x128)、中(256x256)、大(512x512)和超大(1024x512)
- 价格显示为365天租期的总价
- 详情页展示完整信息和购买选项

### NFT管理

- 网格布局展示用户拥有的NFT
- 支持内容更新和续租操作
- 显示租约状态和到期时间
- 详情页提供完整的NFT信息和管理选项

### 管理中心

- 标签式界面区分不同功能
- 创建广告位表单
- 广告位管理列表
- 开发者管理界面


## 优化与改进

最新版本包含以下优化：

1. **用户体验改进**
   - 响应式设计，支持多种设备
   - 加载状态和错误处理优化
   - 统一的价格展示和说明

2. **性能优化**
   - 组件懒加载
   - 数据缓存和状态管理优化
   - 图片加载优化

3. **安全增强**
   - 输入验证和参数检查
   - 交易确认流程优化
   - 权限验证逻辑增强

## 开发指南

### 添加新页面

1. 在`src/pages`目录创建新页面组件
2. 在`App.tsx`中添加路由配置
3. 更新导航菜单


## 部署指南

1. 更新环境配置文件，设置正确的合约参数
2. 构建生产版本：`npm run build`
3. 部署到静态网站托管服务，如Vercel、Netlify等

