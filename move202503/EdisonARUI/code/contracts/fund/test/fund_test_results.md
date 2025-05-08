# 资金合约测试记录
**测试时间**: 2025-04-25 17:42:46
**合约地址**: `0xe0a937e329191a1dc82a5dd325fe061d7a758eb40cd2313497bb1c56fc60d71b`
**FinancePool ID**: `0xdde2a58bfeddbfa4f535ef3867b2c0d8e12b3308dfd617a0e4df38bc4f2f5e44`
**InsuranceCapability ID**: `0xf446b5c71d293269c5749b06319ce90d25aec8aa7922c118e1a15853e4fda2d5`
**BondCapability ID**: `0xa6c5e7a707b5ef26e373c518ca931ff55ce25a5c16250d3bde67103f87779e76`

## 测试环境
- Sui CLI版本: sui 1.47.0-homebrew
- 网络: Testnet

## 测试用例

### 查询资金池初始状态
- **状态**: ✅ 成功
- **交易ID**: `7bgLq3V3SWRCt7oKd73xRaBXgqsQZ5d3VtLfaavzam5d`
- **详情**:
  查询资金池的总余额

### 使用保险模块存入资金
- **状态**: ✅ 成功
- **交易ID**: `9qbqsciYU6Mv9MiUEzGTkfFqei2GKzdJgTVBvZebAh9v`
- **详情**:
  通过保险模块向资金池存入1,000,000单位(1 TEST_BTC)资金

### 查询保险余额
- **状态**: ✅ 成功
- **交易ID**: `4MkHbYDARtrjeWb4cAhuNT71EXuFFqJG7ZNZz9Lcwu97`
- **详情**:
  查询资金池中保险业务相关的余额

### 使用保险模块取出资金
- **状态**: ✅ 成功
- **交易ID**: `HbmyemoaHbBbZm4g8DyMtizFioCVfW3Teg9t8ABUMhew`
- **详情**:
  从资金池通过保险模块取出500,000单位(0.5 TEST_BTC)资金

### 再次查询保险余额
- **状态**: ✅ 成功
- **交易ID**: `GBtnid3DBDVhQWbiwskqnVGWUaR8rza3roq25kc54tp5`
- **详情**:
  查询资金池中保险业务相关的余额，应该减少了500,000单位

### 使用债券模块存入资金
- **状态**: ✅ 成功
- **交易ID**: `2y5nJ3wMvfbBvv7Av1KBrJmdpNXyf9phCveCRFyd71Av`
- **详情**:
  通过债券模块向资金池存入2,000,000单位(2 TEST_BTC)资金

### 查询债券余额
- **状态**: ✅ 成功
- **交易ID**: `7Dd9rnuSNyB2xYrgdnu9zUS1vTeLxZt3c5cnNmprBFS`
- **详情**:
  查询资金池中债券业务相关的余额

### 使用债券模块取出资金
- **状态**: ✅ 成功
- **交易ID**: `E439Wm3Ezyfex25gAoWHm7K7zWsr7iH1FKbHGshUj4qg`
- **详情**:
  从资金池通过债券模块取出1,000,000单位(1 TEST_BTC)资金

### 再次查询债券余额
- **状态**: ✅ 成功
- **交易ID**: `EShpikcFAHxQLgBzcfoyqqbEMwBic1gzBAiDsxWSJrjY`
- **详情**:
  查询资金池中债券业务相关的余额，应该减少了1,000,000单位

### 查询最终总余额
- **状态**: ✅ 成功
- **交易ID**: `DLcnvhBPJCcnS633EysdBFM4pJYHZPJqHYARCgyhTKMN`
- **详情**:
  查询资金池的最终总余额，应该等于保险余额和债券余额之和

## 测试结果摘要
- 总测试数: 10
- 成功: 10
- 失败: 0
EOF 
