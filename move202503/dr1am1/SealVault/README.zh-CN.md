# 🛡️ SealVault

> [English](README.md) | [中文文档](README.zh-CN.md)

**SealVault** 是一个构建在 **Sui 区块链**上的去中心化文件访问控制系统，结合了 [**Walrus**](https://github.com/MystenLabs/walrus) 去中心化文件存储协议与 [**Seal**](https://github.com/MystenLabs/seal) 加密密钥管理框架。

SealVault 的核心理念是：**文件访问权 = NFT 持有权**。用户上传文件，系统自动生成访问 NFT，只有拥有该 NFT 的账户才能访问对应文件，实现真正的 Web3 风格"资产即权限"模型。

---

## ✨ 项目特色

- 📤 **文件上传**：文件将被加密并存储到 Walrus。
- 🔐 **访问控制**：Seal 验证访问请求，确保只有持 NFT 者可以访问。
- 🧬 **访问 NFT**：文件与唯一 NFT 绑定，转移即转移访问权限。
- 🔄 **链上验证**：所有访问权限检查逻辑由 Move 合约实现，安全透明。

---

## 🧱 技术栈

| 层级        | 使用技术                             |
|-------------|--------------------------------------|
| 智能合约    | Move（基于 Sui 区块链）              |
| 文件存储    | [Walrus](https://github.com/MystenLabs/walrus) |
| 密钥管理    | [Seal](https://github.com/MystenLabs/seal)     |
| 前端界面    | React + Tailwind CSS + Vite          |
| 钱包连接    | Sui Wallet             |

---

## 📁 项目结构

```
SealVault/
├── sealvault/             # Move 合约模块：访问控制逻辑
├── SealVault-Frontend/    # 前端：用户交互与合约调用
├── docs/                  # 文档与界面截图（可选）
└── README.md              # 本文件
```

---

## 🚀 快速开始

### 📦 部署 Move 合约

```bash
cd sealvault
sui move build
```

> ✅ 编译后可部署到 devnet 或本地链，记下 Package ID 用于前端调用。

---

### 💻 启动前端项目

```bash
cd SealVault-Frontend
npm install
npm run dev
```

> 打开浏览器访问 `http://localhost:5173` 查看前端界面。(请注意，在SealVault-Frontend文件夹下的.env文件中需要设置环境变量，请根据自己需求配置)

---

## 🔐 Seal & Walrus 简介

### 🦭 🐘 Walrus：去中心化加密存储协议

- 支持文件加密、切片与分布式存储。
- 每个文件对应唯一 `blob_id`，用于后续验证。

### 🦭 Seal：密钥服务与访问控制框架

- 用户访问文件前，Seal 调用 Move 合约中的 `seal_approve` 函数验证权限。
- 只有持有对应 `FileAccessNFT` 的用户，其访问请求才被批准。

SealVault 将 **NFT 持有** 与 **加密访问权限**绑定，真正实现"只有你能打开你上传的东西"。

---

## 🖼️ 示例界面

![主界面](docs/images/main-interface.png)
![文件上传](docs/images/file-upload.png)
![交易确认](docs/images/Pasted%20image%2020250426030737.png)

---

## 📜 许可证

本项目采用 **GNU General Public License v3.0 (GPL-3.0)**：

- ✅ 自由使用、学习、修改与再发布。
- ❗ 修改后的项目也必须以 GPL-3.0 协议继续开源。

详见 [LICENSE](./LICENSE) 文件。

---

## 🙌 致谢

本项目灵感与能力来自以下项目与技术：

- [Sui](https://github.com/MystenLabs/sui)
- [Seal](https://github.com/MystenLabs/seal)
- [Walrus](https://github.com/MystenLabs/walrus)

欢迎贡献与交流，共建安全开放的 Web3 文件管理生态！ 