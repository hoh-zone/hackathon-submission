# core-move

## 1. 发布主合约

修改好 move/buzzing 目录中的本地以依赖，然后按照 sui move 的标准方式发布。

```shell
sui move publish --path .
```

或者，配置好后，也可以使用 cli 方式发布。

```shell
pnpm run cli publish -p buzzing
```

发布后，会输出对应的 配置信息：

```
SUI_NETWORK=testnet
BUZZING_PACKAGE_ID=0x24b6b601e90e14e094860005b2e05e993ba8e2dd4f4c5f8c7bda8474d0c85319
BUZZING_GLOBAL_OBJECT=0x42d6012b478a55c2033fec8e7fd0106f5a656d5b37c620b3b26d14aeb66ba918
BUZZING_GLOBAL_OBJECT_VERSION=412657137
BUZZING_GLOBAL_OBJECT_DIGEST=G1HbRus6s2pkASy9yisnjTpw2PjgQKMAcjZSMKDn9ki8
BUZZING_FAUCET_VALT=0x9f515d2d66affcc46f7763cfebaf0a95c4fcab92f2943bad04ccac347bd2bb62
```
同时会把 AdminCap 的对象 transfer 到合约发布者，作为管理员身份识别。 

## 2. 创建市场

创建市场 合约 入口:

$package::buzzing::create_market

传递参数：

- 类型 T ， 抵押物的 Token类型 默认为 $package::stake_token::STAKE_TOKEN
- question 问题
- options_count 选项个数，暂定为 2,顺序依次为Yes No 
- stake_coin 抵押的 Token
- global 全局配置属性

创建完成后，需要等待市场创建 Token 、Pool 和 更新市场信息。

## 3. 市场list

市场ID 汇总在 全局对象 Global 的 markets 中。


```rust
public struct Global has key,store {
    id: UID,
    // save market list 
    markets: vector<ID>,

    // last question index
    last_question_index: u64,
}
```

## 4. 市场信息结构

```rust

public struct Market <phantom StakeToken> has key, store {
    id: UID,
    question: String,
    question_index: u64,
    // package address, you can find token $package::token::Token 
    token_metas: vector<address>,
    token_pools: vector<address>,

    // options count now is 2 Yes | No
    options_count: u8,

    stake_tokens: Balance<StakeToken>,
    status: u8,

    partitions: vector<u8>,
    
    oracle_cap: Option<ID>,
    
}
```

- token_metas 为发布的两个 Token 的meta 对象信息 Yes 和 No 的顺序
- token_pools 创建的 cetus 的交易池 swap token 需要和 Cetus 交互
- oracle_cap 为标记更新市场结果的凭证
- partitions 为市场结果，需要和 options_count 匹配

## 5. 获取 Yes 和 No 

通过 cetus 的 sdk 完成Yes 和 No

[https://cetus-1.gitbook.io/cetus-developer-docs/developer/via-sdk/getting-started](https://cetus-1.gitbook.io/cetus-developer-docs/developer/via-sdk/getting-started)

也可参考命令行接口 src/commands/buzzing.ts 中的 swap-token 模块

## 6. 更新市场结果

合约接口: $package::buzzing::report_market

参数介绍：

- OracleCap 创建完市场后，签发的 OracleCap
- market 需要更新的market 对象
- partitions 结果 对应了 抵押物的分配

## 7. 获取抵押物

合约接口: $token_package::$token_name::redeem_coin

参数介绍

- market 需要更新的 market 信息
- metadata 当前token 的 metadata 信息 需要和市场中定义的 token_metas 匹配
- coin  当前代币的 Token
- valt 当前代币的回收池

获取逻辑，根据结果，把当前的Token 放入回收池，然后，转移对应的抵押物。 
