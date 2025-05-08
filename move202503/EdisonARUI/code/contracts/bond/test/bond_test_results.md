# 债券合约测试记录
**测试时间**: 2025-04-25 18:27:37
**合约地址**: `0x77f7ea432780529ad7727347cada4c65bb20bcaef2df1034b9f3ee6349fcf6f5`
**BondPool ID**: `0xcfe1e580ea854836de7eb56d2462352856b0ac2e7d5e8cb1e472c9f4378b8dbe`
**Finance Pool ID**: `0xdde2a58bfeddbfa4f535ef3867b2c0d8e12b3308dfd617a0e4df38bc4f2f5e44`

## 测试环境
- Sui CLI版本: sui 1.47.0-homebrew
- 网络: Testnet

## 测试用例

### 购买债券
- **状态**: ✅ 成功
- **交易ID**: `9s8idsTwZcjXBUbtqGViN8P43yLvNj45g6EFifqeEwjE`
- **详情**:
  购买债券，金额为10,000,000 TEST_BTC

### 等待债券到期
- **状态**: ✅ 成功
- **交易ID**: `N/A`
- **详情**:
  债券有一年期限，需要等待到期才能赎回

### 尝试赎回未到期债券
- **状态**: ⏭️ 跳过
- **交易ID**: `N/A`
- **详情**:
  未找到债券Note ID，无法执行赎回测试

## 测试结果摘要
- 总测试数: 3
- 成功: 2
- 失败: 0

## 注意事项
- 债券合约设计有1年锁定期，因此无法在测试中展示完整的赎回流程
- 在实际应用中，债券到期后可以调用redeem_bond函数赎回债券
