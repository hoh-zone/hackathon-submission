#!/bin/bash

# 资金合约测试脚本
# 测试日期: $(date +"%Y-%m-%d")

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # 恢复默认颜色

# 合约地址 - 从contract_deploy_newest.md获取
CLOCK_ID="0x6"
COIN_PACKAGE_ID="0x23fda431351da3c9a3878a4200c76ececd7e17b237d0332751cfde64586e187d"
FUND_PACKAGE_ID="0xe0a937e329191a1dc82a5dd325fe061d7a758eb40cd2313497bb1c56fc60d71b"
ADMIN_ADDRESS="0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc"
FINANCE_POOL_ID="0xdde2a58bfeddbfa4f535ef3867b2c0d8e12b3308dfd617a0e4df38bc4f2f5e44"
INSURANCE_CAP_ID="0xf446b5c71d293269c5749b06319ce90d25aec8aa7922c118e1a15853e4fda2d5"
BOND_CAP_ID="0xa6c5e7a707b5ef26e373c518ca931ff55ce25a5c16250d3bde67103f87779e76"
TEST_BTC_TREASURY_CAP="0xbcf71b38b9be2a0421b5712c99856382a11040ccb9899366aa8bd3141ae83d9c"
echo -e "${YELLOW}使用管理员地址: $ADMIN_ADDRESS${NC}"

# 测试记录文件
TEST_LOG="./test/fund_test_results.md"

# 创建测试记录文件
mkdir -p ./test
cat > $TEST_LOG << EOF
# 资金合约测试记录
**测试时间**: $(date +"%Y-%m-%d %H:%M:%S")
**合约地址**: \`$FUND_PACKAGE_ID\`
**FinancePool ID**: \`$FINANCE_POOL_ID\`
**InsuranceCapability ID**: \`$INSURANCE_CAP_ID\`
**BondCapability ID**: \`$BOND_CAP_ID\`

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
    local tx_digest=$(echo "$result" | grep -oE "Transaction Digest: [a-zA-Z0-9]+" | awk '{print $3}')
    if [ -z "$tx_digest" ]; then
        tx_digest="N/A"
    fi
    
    # 记录测试结果
    log_test_result "$test_name" "$status" "$tx_digest" "$details"
    
    # 打印结果摘要
    echo -e "结果: $status"
    echo -e "交易ID: $tx_digest"
    echo "----------------------------------------"
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
    FIRST_COIN_ID=$COIN_ID
else
    # 铸造测试代币
    echo -e "${YELLOW}铸造测试代币作为交易代币${NC}"
    MINT_CMD="sui client call --function mint --module test_btc --package $COIN_PACKAGE_ID --args $TEST_BTC_TREASURY_CAP 1000000 $ADMIN_ADDRESS --gas-budget 100000000"
    echo -e "${YELLOW}执行命令: $MINT_CMD${NC}"
    MINT_RESULT=$(eval $MINT_CMD)
    echo "$MINT_RESULT"

    # 提取铸造的代币ID
    if [[ $MINT_RESULT == *"Created Objects"* ]]; then
        COIN_ID=$(echo "$MINT_RESULT" | grep -A 5 "Created Objects" | grep -oE "0x[a-f0-9]+" | head -1)
        if [ -n "$COIN_ID" ]; then
            echo -e "${GREEN}成功提取铸造的代币ID: $COIN_ID${NC}"
            FIRST_COIN_ID=$COIN_ID
        else
            echo -e "${RED}无法从输出中提取代币ID${NC}"
            # 检查所有新创建的代币
            echo -e "${YELLOW}尝试查找最近创建的TEST_BTC代币...${NC}"
            COIN_ID=$(sui client objects --json | grep -A 10 "test_btc::TEST_BTC" | grep -oE "\"objectId\":\s*\"0x[a-f0-9]+\"" | grep -oE "0x[a-f0-9]+" | head -1)
            if [ -n "$COIN_ID" ]; then
                echo -e "${GREEN}找到候选TEST_BTC代币: $COIN_ID${NC}"
                FIRST_COIN_ID=$COIN_ID
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

# 再铸造一个代币用于第二个测试
echo -e "${YELLOW}铸造第二个测试代币${NC}"
MINT_CMD2="sui client call --function mint --module test_btc --package $COIN_PACKAGE_ID --args $TEST_BTC_TREASURY_CAP 2000000 $ADMIN_ADDRESS --gas-budget 100000000"
echo -e "${YELLOW}执行命令: $MINT_CMD2${NC}"
MINT_RESULT2=$(eval $MINT_CMD2)

# 提取第二个铸造的代币ID
if [[ $MINT_RESULT2 == *"Created Objects"* ]]; then
    SECOND_COIN_ID=$(echo "$MINT_RESULT2" | grep -A 5 "Created Objects" | grep -oE "0x[a-f0-9]+" | head -1)
    if [ -n "$SECOND_COIN_ID" ]; then
        echo -e "${GREEN}成功提取第二个铸造的代币ID: $SECOND_COIN_ID${NC}"
    else
        echo -e "${RED}无法从输出中提取第二个代币ID${NC}"
        # 检查所有新创建的代币，排除第一个
        echo -e "${YELLOW}尝试查找最近创建的TEST_BTC代币...${NC}"
        SECOND_COIN_ID=$(sui client objects --json | grep -A 10 "test_btc::TEST_BTC" | grep -oE "\"objectId\":\s*\"0x[a-f0-9]+\"" | grep -oE "0x[a-f0-9]+" | grep -v "$FIRST_COIN_ID" | head -1)
        if [ -n "$SECOND_COIN_ID" ]; then
            echo -e "${GREEN}找到候选TEST_BTC代币: $SECOND_COIN_ID${NC}"
        else
            echo -e "${RED}无法找到第二个TEST_BTC代币，终止测试${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}铸造第二个代币失败，无法继续测试${NC}"
    exit 1
fi

# 获取当前时间戳
TIMESTAMP=$(date +%s)

# 测试1: 查询资金池初始状态
run_test "查询资金池初始状态" \
"sui client call \
    --function total_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池的总余额"

# 测试2: 使用保险模块存入资金
run_test "使用保险模块存入资金" \
"sui client call \
    --function deposit_insurance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID $INSURANCE_CAP_ID $FIRST_COIN_ID $TIMESTAMP \
    --gas-budget 100000000" \
"通过保险模块向资金池存入1,000,000单位(1 TEST_BTC)资金"

# 测试3: 查询保险余额
run_test "查询保险余额" \
"sui client call \
    --function insurance_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池中保险业务相关的余额"

# 测试4: 使用保险模块取出资金
run_test "使用保险模块取出资金" \
"sui client call \
    --function withdraw_insurance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID $INSURANCE_CAP_ID 500000 $TIMESTAMP \
    --gas-budget 100000000" \
"从资金池通过保险模块取出500,000单位(0.5 TEST_BTC)资金"

# 测试5: 再次查询保险余额
run_test "再次查询保险余额" \
"sui client call \
    --function insurance_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池中保险业务相关的余额，应该减少了500,000单位"

# 测试6: 使用债券模块存入资金
run_test "使用债券模块存入资金" \
"sui client call \
    --function deposit_bond \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID $BOND_CAP_ID $SECOND_COIN_ID $TIMESTAMP \
    --gas-budget 100000000" \
"通过债券模块向资金池存入2,000,000单位(2 TEST_BTC)资金"

# 测试7: 查询债券余额
run_test "查询债券余额" \
"sui client call \
    --function bond_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池中债券业务相关的余额"

# 测试8: 使用债券模块取出资金
run_test "使用债券模块取出资金" \
"sui client call \
    --function withdraw_bond \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID $BOND_CAP_ID 1000000 $TIMESTAMP \
    --gas-budget 100000000" \
"从资金池通过债券模块取出1,000,000单位(1 TEST_BTC)资金"

# 测试9: 再次查询债券余额
run_test "再次查询债券余额" \
"sui client call \
    --function bond_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池中债券业务相关的余额，应该减少了1,000,000单位"

# 测试10: 查询最终总余额
run_test "查询最终总余额" \
"sui client call \
    --function total_balance \
    --module fund \
    --package $FUND_PACKAGE_ID \
    --args $FINANCE_POOL_ID \
    --gas-budget 100000000" \
"查询资金池的最终总余额，应该等于保险余额和债券余额之和"

# 完成测试
echo -e "${GREEN}测试完成!${NC}"
echo -e "${GREEN}测试结果已记录到 $TEST_LOG${NC}"

# 测试结果摘要
cat >> $TEST_LOG << EOF

## 测试结果摘要
- 总测试数: 10
- 成功: $(grep -c "✅ 成功" $TEST_LOG)
- 失败: $(grep -c "❌ 失败" $TEST_LOG)
EOF 