#!/bin/bash

# 保险合约测试脚本
# 测试日期: $(date +"%Y-%m-%d")

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # 恢复默认颜色

# 合约地址 - 从contract_deploy_newest.md获取
# 最新的合约地址
CLOCK_ID="0x6"
COIN_PACKAGE_ID="0x23fda431351da3c9a3878a4200c76ececd7e17b237d0332751cfde64586e187d"
INSURANCE_PACKAGE_ID="0x02e6c1c3d4595c53979f5281e46479dcaaf62327a018c61c455c515a11a75931"
ADMIN_ADDRESS="0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc"
POLICY_MANAGER_ID="0xdadd1668f95ee3c34c2725cb7fe2499929e57a7690e6c770a9990f4c86c71b15"
TEST_BTC_TREASURY_CAP="0xbcf71b38b9be2a0421b5712c99856382a11040ccb9899366aa8bd3141ae83d9c"

# 资金池相关
FUND_PACKAGE_ID="0xe0a937e329191a1dc82a5dd325fe061d7a758eb40cd2313497bb1c56fc60d71b"
FINANCE_POOL_ID="0xdde2a58bfeddbfa4f535ef3867b2c0d8e12b3308dfd617a0e4df38bc4f2f5e44"
INSURANCE_CAPABILITY_ID="0xf446b5c71d293269c5749b06319ce90d25aec8aa7922c118e1a15853e4fda2d5"

# 债券相关
BOND_PACKAGE_ID="0x77f7ea432780529ad7727347cada4c65bb20bcaef2df1034b9f3ee6349fcf6f5"
BOND_POOL_ID="0xcfe1e580ea854836de7eb56d2462352856b0ac2e7d5e8cb1e472c9f4378b8dbe"
BOND_CAPABILITY_ID="0xa6c5e7a707b5ef26e373c518ca931ff55ce25a5c16250d3bde67103f87779e76"

echo -e "${YELLOW}使用管理员地址: $ADMIN_ADDRESS${NC}"

# 测试记录文件
TEST_LOG="./test/insurance_test_results.md"

# 创建测试记录文件
mkdir -p ./test
cat > $TEST_LOG << EOF
# 保险合约测试记录
**测试时间**: $(date +"%Y-%m-%d %H:%M:%S")
**合约地址**: \`$INSURANCE_PACKAGE_ID\`
**PolicyManager ID**: \`$POLICY_MANAGER_ID\`
**Finance Pool ID**: \`$FINANCE_POOL_ID\`

## 测试环境
- Sui CLI版本: $(sui --version)
- 网络: Testnet

## 测试用例
EOF

# 辅助函数 - 记录测试结果
log_test_result() {
    local test_name=$1
    local status=$2
    local tx_digest=$3
    local details=$4
    
    echo -e "${YELLOW}记录测试结果: $test_name${NC}"
    
    cat >> $TEST_LOG << EOF

### $test_name
- **状态**: $status
- **交易ID**: \`$tx_digest\`
- **详情**:
  $details
EOF
}

# 辅助函数 - 执行测试并记录结果
run_test() {
    local test_name=$1
    local command=$2
    local details=$3
    
    echo -e "${YELLOW}执行测试: $test_name${NC}"
    echo -e "${YELLOW}命令: $command${NC}"
    
    # 执行命令并捕获输出
    local result
    local status
    result=$(eval $command 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}测试成功!${NC}"
        status="✅ 成功"
    else
        echo -e "${RED}测试失败!${NC}"
        status="❌ 失败"
        echo -e "${RED}错误详情: ${NC}"
        echo "$result"
    fi
    
    # 提取交易摘要
    local tx_digest=$(echo "$result" | grep -oE "Digest: [a-zA-Z0-9]+" | head -1 | awk '{print $2}')
    if [ -z "$tx_digest" ]; then
        tx_digest="N/A"
    fi
    
    # 记录测试结果
    log_test_result "$test_name" "$status" "$tx_digest" "$details"
    
    # 打印结果摘要
    echo -e "结果: $status"
    echo -e "交易ID: $tx_digest"
    echo "----------------------------------------"
    
    # 返回交易摘要供后续使用
    echo "$tx_digest"
}

# 查找可用的TEST_BTC代币
find_usable_test_btc() {
    echo -e "${YELLOW}查找可用的TEST_BTC代币...${NC}"
    TEST_BTC_COINS=$(sui client objects --json | grep -B 5 "::test_btc::TEST_BTC.*Coin" | grep -oE "\"objectId\":\s*\"0x[a-f0-9]+\"" | grep -oE "0x[a-f0-9]+" | head -1)
    if [ -n "$TEST_BTC_COINS" ]; then
        echo -e "${GREEN}找到可用TEST_BTC代币: $TEST_BTC_COINS${NC}"
        return 0
    else
        echo -e "${RED}没有找到可用的TEST_BTC代币，需要铸造新代币${NC}"
        return 1
    fi
}

# 获取当前SUI余额
echo -e "${YELLOW}获取当前SUI余额${NC}"
sui client gas

# 尝试查找已有的TEST_BTC代币
find_usable_test_btc
if [ $? -eq 0 ]; then
    COIN_ID=$TEST_BTC_COINS
else
    # 铸造测试代币作为保费支付
    echo -e "${YELLOW}铸造测试代币作为保费支付${NC}"
    MINT_CMD="sui client call --function mint --module test_btc --package $COIN_PACKAGE_ID --args $TEST_BTC_TREASURY_CAP 1000000 $ADMIN_ADDRESS --gas-budget 100000000"
    echo -e "${YELLOW}执行命令: $MINT_CMD${NC}"
    MINT_RESULT=$(eval $MINT_CMD)
    echo "$MINT_RESULT"

    # 提取铸造的代币ID - 改进提取方法
    if [[ $MINT_RESULT == *"Created Objects"* ]]; then
        COIN_ID=$(echo "$MINT_RESULT" | grep -A 10 "Created Objects" | grep -oE "0x[a-f0-9]+" | head -1)
        if [ -n "$COIN_ID" ]; then
            echo -e "${GREEN}成功提取铸造的代币ID: $COIN_ID${NC}"
        else
            echo -e "${RED}无法从输出中提取代币ID${NC}"
            # 检查所有新创建的代币
            echo -e "${YELLOW}尝试查找最近创建的TEST_BTC代币...${NC}"
            COIN_ID=$(sui client objects --json | grep -A 10 "test_btc::TEST_BTC" | grep -oE "\"objectId\":\s*\"0x[a-f0-9]+\"" | grep -oE "0x[a-f0-9]+" | head -1)
            if [ -n "$COIN_ID" ]; then
                echo -e "${GREEN}找到候选TEST_BTC代币: $COIN_ID${NC}"
            else
                echo -e "${RED}无法找到任何TEST_BTC代币，终止测试${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${RED}铸造代币失败，无法继续测试${NC}"
        exit 1
    fi
fi

# 再铸造一个小额代币用于测试保费不足的情况
echo -e "${YELLOW}铸造小额测试代币用于测试保费不足的情况${NC}"
SMALL_MINT_CMD="sui client call --function mint --module test_btc --package $COIN_PACKAGE_ID --args $TEST_BTC_TREASURY_CAP 100 $ADMIN_ADDRESS --gas-budget 100000000"
echo -e "${YELLOW}执行命令: $SMALL_MINT_CMD${NC}"
SMALL_MINT_RESULT=$(eval $SMALL_MINT_CMD)
SMALL_COIN_ID=$(echo "$SMALL_MINT_RESULT" | grep -A 10 "Created Objects" | grep -oE "0x[a-f0-9]+" | head -1)
if [ -n "$SMALL_COIN_ID" ]; then
    echo -e "${GREEN}成功提取小额代币ID: $SMALL_COIN_ID${NC}"
else
    echo -e "${RED}无法提取小额代币ID，使用之前的代币进行测试${NC}"
    SMALL_COIN_ID=$COIN_ID
fi

# 测试0: 尝试创建保费不足的保单（应该失败）
INSUFFICIENT_PREMIUM_CMD="sui client call --function mint_insurance --module insurance --package $INSURANCE_PACKAGE_ID --args $POLICY_MANAGER_ID $FINANCE_POOL_ID $INSURANCE_CAPABILITY_ID 10000000 30 $SMALL_COIN_ID $CLOCK_ID --gas-budget 100000000"
run_test "创建保费不足的保单" "$INSUFFICIENT_PREMIUM_CMD" "尝试创建保费不足的保单（应该失败），保额为10,000,000，但只支付了100的保费"

# 测试1: 创建保险保单
MINT_INSURANCE_CMD="sui client call --function mint_insurance --module insurance --package $INSURANCE_PACKAGE_ID --args $POLICY_MANAGER_ID $FINANCE_POOL_ID $INSURANCE_CAPABILITY_ID 1000000 30 $COIN_ID $CLOCK_ID --gas-budget 100000000"
echo -e "${YELLOW}执行命令: $MINT_INSURANCE_CMD${NC}"
MINT_TX_DIGEST=$(run_test "创建保险保单" "$MINT_INSURANCE_CMD" "创建了一个30天期限，保额为1,000,000 (1 TEST_BTC)的保险保单，并将保费存入资金池")

# 获取交易详情以找到新创建的保单NFT ID
sleep 2 # 等待交易确认
echo -e "${YELLOW}获取交易详情以查找新创建的保单NFT ID${NC}"
TX_DETAILS=$(sui client tx-block $MINT_TX_DIGEST)

# 获取新创建的保单NFT ID
POLICY_NFT_ID=$(echo "$TX_DETAILS" | grep -A 15 "Created Objects" | grep -oE "0x[a-f0-9]+" | grep -v "$COIN_ID" | head -1)

if [ -z "$POLICY_NFT_ID" ]; then
    echo -e "${YELLOW}从交易详情中未找到NFT ID，尝试从对象列表中查找${NC}"
    sui client objects
    POLICY_NFT_ID=$(sui client objects --json | grep -A 10 "insurance.*NFT" | grep -oE "\"objectId\":\s*\"0x[a-f0-9]+\"" | grep -oE "0x[a-f0-9]+" | head -1)
fi

echo -e "${YELLOW}保单NFT ID: $POLICY_NFT_ID${NC}"

# 测试2: 更新基准费率
run_test "更新基准费率" \
"sui client call \
    --function update_base_rate \
    --module insurance \
    --package $INSURANCE_PACKAGE_ID \
    --args $POLICY_MANAGER_ID 3 \
    --gas-budget 100000000" \
"将基准费率从2%更新为3%"

# 测试3: 更新波动性系数
run_test "更新波动性系数" \
"sui client call \
    --function update_volatility \
    --module insurance \
    --package $INSURANCE_PACKAGE_ID \
    --args $POLICY_MANAGER_ID 8 \
    --gas-budget 100000000" \
"将波动性系数从5%更新为8%"

# 测试4: 尝试非管理员更新费率（应该失败）
# 我们需要一个非管理员地址来测试
# 这里假设我们只有一个地址，所以这个测试会被跳过
# 如果有多个地址，可以使用其他地址测试

# 测试5: 保险赔付测试 (生成简单的证明数据)
if [ -n "$POLICY_NFT_ID" ]; then
    PROOF="0x0102030405" # 简单的证明数据
    run_test "保险赔付申请" \
    "sui client call \
        --function claim \
        --module insurance \
        --package $INSURANCE_PACKAGE_ID \
        --args $POLICY_MANAGER_ID $FINANCE_POOL_ID $INSURANCE_CAPABILITY_ID $POLICY_NFT_ID \"$PROOF\" $CLOCK_ID \
        --gas-budget 100000000" \
    "使用简单证明数据申请保险赔付，从资金池提取保险金额"
else
    echo -e "${RED}未找到保单NFT ID，跳过赔付测试${NC}"
    log_test_result "保险赔付申请" "⏭️ 跳过" "N/A" "未找到保单NFT ID，无法执行赔付测试"
fi

# 测试6: 尝试对已赔付的保单再次赔付（应该失败）
if [ -n "$POLICY_NFT_ID" ]; then
    PROOF="0x0102030405" # 简单的证明数据
    run_test "对已赔付保单再次申请赔付" \
    "sui client call \
        --function claim \
        --module insurance \
        --package $INSURANCE_PACKAGE_ID \
        --args $POLICY_MANAGER_ID $FINANCE_POOL_ID $INSURANCE_CAPABILITY_ID $POLICY_NFT_ID \"$PROOF\" $CLOCK_ID \
        --gas-budget 100000000" \
    "尝试对已赔付的保单再次申请赔付（应该失败）"
else
    echo -e "${RED}未找到保单NFT ID，跳过重复赔付测试${NC}"
    log_test_result "对已赔付保单再次申请赔付" "⏭️ 跳过" "N/A" "未找到保单NFT ID，无法执行重复赔付测试"
fi

# 完成测试
echo -e "${GREEN}测试完成!${NC}"
echo -e "${GREEN}测试结果已记录到 $TEST_LOG${NC}"

# 测试结果摘要
cat >> $TEST_LOG << EOF

## 测试结果摘要
- 总测试数: 6
- 成功: $(grep -c "✅ 成功" $TEST_LOG)
- 失败: $(grep -c "❌ 失败" $TEST_LOG)
EOF 