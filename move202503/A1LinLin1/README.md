# Sui Move 安全审计平台

一个基于 Sui 区块链和 Move 语言的智能合约静态安全审计工具，包含：

- **后端服务**：使用 Node.js 提供接口，采集链上数据并与前端交互。
- **前端应用**：基于 Vite + React + TypeScript，集成 Sui Wallet，展示审计报告。
- **静态分析 CLI**：使用 TypeScript 实现的命令行工具，对 Move 源码进行漏洞检测。
- **智能合约示例**：`contracts/audit/ReportStore.move` 模块及测试，用于演示如何提交与存储审计报告。

---

## 目录结构
```bash
hackathon/
├── backend/               # 后端服务
│   ├── package.json       # NPM 配置
│   ├── server.js          # Express 服务入口
│   ├── submit.js          # 链上提交脚本
│   └── utils.js           # 工具函数
├── contracts/             # Move 合约模块
│   └── audit/
│       ├── Move.toml      # Move 项目配置
│       ├── Move.lock      # 依赖锁定文件
│       └── sources/
│           └── ReportStore.move  # 审计存储合约
├── examples/              # 演示用合约 & 测试
│   ├── ExampleErrors.move
│   └── Example.move
├── frontend/              # 前端应用
│   ├── README.md          # 前端 README
│   ├── package.json
│   ├── vite.config.ts
│   └── src/               # 源码
│       ├── main.tsx
│       ├── App.tsx
│       ├── suiClient.ts   # Sui 客户端封装
│       └── components/    # React 组件
├── src/                   # 静态分析工具核心代码
│   ├── cli.ts             # CLI 入口
│   ├── detectors/         # 各类漏洞检测器
│   └── parser.ts          # Move 语法解析
├── vendor/                # 本地依赖：tree-sitter-move
├── LICENSE                # MIT 许可证
└── README.md              # 本文件
```

---

## 快速开始

### 环境准备
- Node.js >= 18
- npm 或 yarn
- Sui 客户端 (可选，用于链上交互)

### 后端服务
```bash
cd backend
npm install
node server.js          # 启动服务，默认监听 http://localhost:3001
```

### 前端应用
```bash
cd frontend
npm install
npm run dev             # 启动 Vite 开发服务器，访问 http://localhost:3000
```

### 静态分析 CLI
```bash
# 在项目根目录
npm install             # 安装根目录依赖（TypeScript、tree-sitter 等）
npm run build           # 编译 TypeScript 到 dist
npm start -- examples/ExampleErrors.move
# 或者扫描整个目录：
npm start -- scan ./src
```

---

## 使用示例

1. **提交审计报告到链上**：在后端目录运行 `node submit.js`，将本地生成的审计报告通过 Sui 客户端提交到 `ReportStore` 合约。
2. **查看审计报告**：在前端页面点击「加载报告」，将自动从后端拉取链上存储的报告并展示在表格中。
3. **静态扫描 Move 源码**：运行 CLI 工具，对自定义 Move 模块进行访问控制、重入、溢出等多种安全检测。

---

## 前端展示

在浏览器中访问 `http://localhost:5173` 后，你将看到如下界面：

![前端审计报告页面](https://raw.githubusercontent.com/A1LinLin1/blog-images/main/hackathon.png)

---

## 技术栈
- **后端**：Node.js, Express, @mysten/sui 客户端
- **前端**：Vite, React, TypeScript, @suiet/wallet-kit
- **静态分析**：TypeScript, tree-sitter-move, Node.js CLI
- **合约**：Move (Sui)


#成员
- A1LinLin1: 擅长python、熟悉C++、Java。有github两年开发经验，爱好网络空间安全相关领域，对区块链的分布式、去中心化特性感兴趣，想通过对sui生态move语言的学习深入区块链技术。
