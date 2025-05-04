# NarrFlow 智能合约

NarrFlow是一个去中心化的协作叙事平台，用户可以创建故事、添加段落并对故事的发展方向进行投票，所有参与者可获得代币奖励。

## 架构设计

本项目采用模块化设计，划分为三个核心模块：

1. **故事模块 (story.move)** - 管理故事的创建和发展
2. **代币模块 (token.move)** - 处理NARR代币与奖励机制
3. **核心模块 (narr_flow.move)** - 整合上述模块，提供复合业务功能

## 功能特性

### 故事模块
- **故事创建**：用户可以创建新故事并设置标题
- **段落添加**：作者可以添加新段落发展故事
- **投票机制**：用户可对段落提案进行投票
- **提案系统**：用户可提交段落提案供社区投票
- **事件通知**：所有关键操作都会触发事件供前端监听

### 代币模块
- **NARR代币**：平台原生代币，作为创作和参与奖励
- **财库管理**：中央化财库管理代币分发
- **多种奖励类型**：
  - 故事创建奖励：100 NARR
  - 段落添加奖励：20 NARR
  - 获胜提案奖励：50 NARR
  - 投票参与奖励：5 NARR
- **管理员控制**：专有权限功能，如自定义奖励

### 核心模块
- **业务整合**：连接故事和代币系统
- **平台管理**：提供平台级别的管理功能
- **权限控制**：确保敏感操作只能由授权用户执行

## 存储策略

NarrFlow使用Walrus作为去中心化存储解决方案：

1. **链上存储**：仅保存元数据和Walrus引用
   - 故事和段落ID、作者信息、时间戳
   - 投票数据和结果
   - 指向Walrus内容的引用ID

2. **Walrus存储**：存储实际内容
   - 存储完整的故事文本和段落内容
   - 利用Sui原生的Walrus系统确保数据持久性
   - 通过内容哈希验证确保完整性

3. **数据结构优化**：
```move
struct Paragraph {
    walrus_id: vector<u8>,    // Walrus内容引用ID
    content_hash: vector<u8>, // 内容验证哈希
    preview: String,          // 内容简短预览
    author: address,          // 作者地址
    timestamp: u64            // 创建时间戳
}
```

## 数据模型

### 故事结构
```
struct Story {
    id: UID,                            // 故事唯一ID
    title: String,                      // 故事标题
    author: address,                    // 创作者地址
    paragraphs: vector<Paragraph>,      // 段落列表
    current_voting: Option<VotingSession>, // 当前投票会话
    completed: bool                     // 故事是否完成
}
```

### 代币管理
```
struct Treasury {
    id: UID,                            // 财库唯一ID
    balance: Balance<NARR>,             // NARR代币余额
    admin: address                      // 管理员地址
}
```

## 事件系统

本合约通过事件系统实现链上活动的前端监听：

- **StoryCreated** - 当新故事创建时触发
- **ParagraphAdded** - 当段落添加时触发
- **VotingStarted** - 当投票会话开始时触发
- **VoteSubmitted** - 当用户投票时触发
- **TokensRewarded** - 当代币奖励发放时触发

## 开发与部署

### 前提条件
- Sui CLI 已安装
- 对Move语言有基本了解
- Walrus CLI工具（用于内容存储）

### 编译步骤
```bash
# 进入合约目录
cd move

# 编译所有合约
sui move build

# 测试合约
sui move test

# 发布合约
sui client publish --gas-budget 100000000
```

### 测试合约

我们提供了一组单元测试来验证合约功能：

```bash
sui move test
```

## 安全考量

1. **权限控制** - 敏感操作受到严格的权限检查
2. **余额验证** - 所有代币操作前都会验证余额
3. **状态验证** - 函数调用前会验证系统状态的合法性
4. **错误处理** - 详细的错误代码体系便于调试
5. **内容验证** - 使用哈希验证确保从Walrus检索的内容完整性

## API参考

### 故事模块
- `create_story(title, first_paragraph)` - 创建新故事
- `add_paragraph(story, walrus_id, content_hash, preview)` - 向故事添加段落
- `start_voting(story, proposals, voting_duration)` - 开始投票会话
- `cast_vote(story, proposal_index)` - 为提案投票
- `complete_story(story)` - 结束投票并完成故事

### 代币模块
- `reward_story_creation(treasury, receiver, story_id)` - 奖励故事创建者
- `reward_paragraph_addition(treasury, receiver, story_id)` - 奖励段落添加者
- `reward_winning_proposal(treasury, receiver, story_id)` - 奖励获胜提案作者
- `reward_voter(treasury, receiver, story_id)` - 奖励投票者
- `admin_reward(treasury, receiver, amount, story_id)` - 管理员自定义奖励

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 本地编译、部署与交互（基于Sui官方文档）

### 1. 本地编译与单元测试
```bash
cd move
sui move build
sui move test
```

### 2. 本地发布合约（假设已配置好sui钱包和本地节点）
```bash
sui client publish --gas-budget 100000000
```
发布后会输出packageId，后续交互需用到。

### 3. 使用sui client call与合约交互
以调用story.move的create_story为例：
```bash
sui client call \
  --package <packageId> \
  --module story \
  --function create_story \
  --args '"故事标题"' '"<64位内容哈希>"' '"<walrus_id>"' \
  --gas-budget 100000000
```
参数说明：
- <packageId>：发布合约后获得的包ID
- <64位内容哈希>：前端生成的内容哈希
- <walrus_id>：内容在Walrus存储的ID

### 4. 推荐交互脚本结构
可在项目根目录新建`scripts/interaction.sh`，批量执行常用交互命令。例如：
```bash
#!/bin/bash
PACKAGE_ID=xxxx # 替换为实际packageId
sui client call \
  --package $PACKAGE_ID \
  --module story \
  --function create_story \
  --args '"测试标题"' '"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"' '"walrus_123456"' \
  --gas-budget 100000000
```
记得赋予脚本可执行权限：
```bash
chmod +x scripts/interaction.sh
```

---
如需更多复杂交互，可参考[Sui官方CLI文档](https://docs.sui.io/build/cli-client)和Move合约参数类型说明。 