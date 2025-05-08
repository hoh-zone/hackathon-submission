#!/bin/bash

# HashCAT 合约部署脚本
# 用于部署 coin、fund、insurance、bond 和 pool 合约（不包括bridge合约）

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 恢复默认颜色

# 时间戳
TIMESTAMP=$(date +"%Y-%m-%d")

# 管理员地址
ADMIN_ADDRESS=$(sui client active-address)
echo -e "${YELLOW}使用管理员地址: $ADMIN_ADDRESS${NC}"

# 创建部署日志目录
DEPLOY_LOG_DIR="./deploy_logs"
DEPLOY_LOG="$DEPLOY_LOG_DIR/deploy_log_$TIMESTAMP.json"
mkdir -p $DEPLOY_LOG_DIR

# 更新合约部署记录
update_deploy_records() {
    local package_name=$1
    local package_id=$2
    local deploy_tx=$3
    local modules=$4
    local resources=$5
    local gas_cost=$6
    
    # 初始准备 - 确保目标文件存在
    touch contract_deploy_newest.md
    touch contract_deploy_history.md
    
    echo -e "${YELLOW}更新部署记录文件...${NC}"
    
    # 创建新的历史记录内容
    local new_history_content
    new_history_content="# 历史合约部署记录\n\n"
    new_history_content+="## $package_name 合约部署记录\n"
    new_history_content+="**部署时间**: $TIMESTAMP\n"
    new_history_content+="**网络**: Sui Testnet\n"
    new_history_content+="**部署交易**: \`$deploy_tx\`\n\n"
    new_history_content+="### 合约地址\n"
    new_history_content+="- **Package ID**: \`$package_id\`\n"
    new_history_content+="- **Package 版本**: 1\n"
    new_history_content+="- **模块列表**:\n"
    
    for module in $modules; do
        new_history_content+="  - \`$module\`\n"
    done
    
    new_history_content+="\n$resources\n\n"
    new_history_content+="### 部署成本\n"
    new_history_content+="$gas_cost\n\n"
    new_history_content+="### 验证步骤\n"
    new_history_content+="1. 在 Sui Explorer 中查看交易：\n"
    new_history_content+="   \`\`\`\n"
    new_history_content+="   https://suiexplorer.com/txblock/$deploy_tx\n"
    new_history_content+="   \`\`\`\n\n"
    
    # 直接重写历史记录文件，将新记录添加到顶部
    # 读取现有历史记录（如果有）
    if [ -s "contract_deploy_history.md" ]; then
        local existing_history=$(cat "contract_deploy_history.md")
        # 检查现有内容是否包含标题
        if [[ $existing_history == *"# 历史合约部署记录"* ]]; then
            # 如果已包含标题，去掉新内容中的标题
            new_history_content=$(echo -e "$new_history_content" | sed '1,2d')
        fi
        # 写入新内容+现有内容
        echo -e "$new_history_content$existing_history" > "contract_deploy_history.md.new"
    else
        # 如果历史记录为空，直接写入新内容
        echo -e "$new_history_content" > "contract_deploy_history.md.new"
    fi
    
    # 使用原子操作替换文件
    mv "contract_deploy_history.md.new" "contract_deploy_history.md"
    
    # 创建新的newest记录内容
    local new_newest_content
    
    # 检查是否已有内容
    if [ -s "contract_deploy_newest.md" ]; then
        # 先读取现有内容
        local existing_content=$(cat "contract_deploy_newest.md")
        
        # 删除特定合约部分（如果存在）
        existing_content=$(echo "$existing_content" | awk -v pkg="$package_name" '
        BEGIN { skip=0; removed=0; }
        /^## / { 
            if (skip==1) { skip=0; }
            if ($0 ~ "## " pkg " 合约") { skip=1; removed=1; next; }
        }
        { if (skip==0) print; }
        END { if (removed==0) print ""; }
        ')
        
        # 准备新的合约内容
        new_newest_content="## $package_name 合约\n"
        new_newest_content+="**部署时间**: $TIMESTAMP\n"
        new_newest_content+="**网络**: Sui Testnet\n"
        new_newest_content+="**部署交易**: \`$deploy_tx\`\n\n"
        new_newest_content+="### 合约地址\n"
        new_newest_content+="- **Package ID**: \`$package_id\`\n"
        new_newest_content+="- **Package 版本**: 1\n"
        new_newest_content+="- **模块列表**:\n"
        
        for module in $modules; do
            new_newest_content+="  - \`$module\`\n"
        done
        
        new_newest_content+="\n$resources\n\n"
        new_newest_content+="### 部署成本\n"
        new_newest_content+="$gas_cost\n\n"
        new_newest_content+="### 验证步骤\n"
        new_newest_content+="1. 在 Sui Explorer 中查看交易：\n"
        new_newest_content+="   \`\`\`\n"
        new_newest_content+="   https://suiexplorer.com/txblock/$deploy_tx\n"
        new_newest_content+="   \`\`\`\n"
        
        # 合并内容并写入临时文件
        echo -e "$existing_content\n$new_newest_content" > "contract_deploy_newest.md.new"
    else
        # 如果文件为空，创建新的内容
        new_newest_content="# 最新合约部署记录\n\n"
        new_newest_content+="## $package_name 合约\n"
        new_newest_content+="**部署时间**: $TIMESTAMP\n"
        new_newest_content+="**网络**: Sui Testnet\n"
        new_newest_content+="**部署交易**: \`$deploy_tx\`\n\n"
        new_newest_content+="### 合约地址\n"
        new_newest_content+="- **Package ID**: \`$package_id\`\n"
        new_newest_content+="- **Package 版本**: 1\n"
        new_newest_content+="- **模块列表**:\n"
        
        for module in $modules; do
            new_newest_content+="  - \`$module\`\n"
        done
        
        new_newest_content+="\n$resources\n\n"
        new_newest_content+="### 部署成本\n"
        new_newest_content+="$gas_cost\n\n"
        new_newest_content+="### 验证步骤\n"
        new_newest_content+="1. 在 Sui Explorer 中查看交易：\n"
        new_newest_content+="   \`\`\`\n"
        new_newest_content+="   https://suiexplorer.com/txblock/$deploy_tx\n"
        new_newest_content+="   \`\`\`\n"
        
        # 写入新文件
        echo -e "$new_newest_content" > "contract_deploy_newest.md.new"
    fi
    
    # 使用原子操作替换文件
    mv "contract_deploy_newest.md.new" "contract_deploy_newest.md"
    
    echo -e "${GREEN}部署记录已更新到contract_deploy_newest.md和contract_deploy_history.md${NC}"
}

# 解析部署输出中的对象ID
extract_object_id() {
    local output=$1
    local pattern=$2
    echo "$output" | grep -A 5 "$pattern" | grep -oE "Object ID: 0x[a-f0-9]+" | head -1 | awk '{print $3}'
}

# 解析Gas成本
extract_gas_cost() {
    local output=$1
    
    # 提取计算成本
    local computation=$(echo "$output" | grep "Computation Cost:" | awk '{print $3}')
    if [ -z "$computation" ]; then
        computation=0
    fi
    
    # 提取存储成本
    local storage=$(echo "$output" | grep "Storage Cost:" | awk '{print $3}')
    if [ -z "$storage" ]; then
        storage=0
    fi
    
    # 提取存储返还
    local rebate=$(echo "$output" | grep "Storage Rebate:" | awk '{print $3}')
    if [ -z "$rebate" ]; then
        rebate=0
    fi
    
    # 提取不可退还费用
    local non_refundable=$(echo "$output" | grep "Non-refundable Storage Fee:" | awk '{print $3}')
    if [ -z "$non_refundable" ]; then
        non_refundable=0
    fi
    
    # 计算总成本 (避免直接使用表达式)
    local total=0
    # 使用expr替代算术扩展，以避免语法错误
    total=$(expr $computation + $storage - $rebate + $non_refundable)
    
    echo "- 计算成本: $computation gas"
    echo "- 存储成本: $storage gas"
    echo "- 存储返还: $rebate gas"
    echo "- 不可退还费用: $non_refundable gas"
    echo "- 总花费: $total gas"
}

# 更新Move.toml中的依赖地址
update_dependencies() {
    local src_package=$1
    local target_package=$2
    local package_id=$3
    
    echo -e "${YELLOW}更新 $target_package 合约中对 $src_package 的依赖...${NC}"
    
    # 检查Move.toml是否存在
    if [ ! -f "./$target_package/Move.toml" ]; then
        echo -e "${RED}错误: $target_package/Move.toml 文件不存在${NC}"
        return 1
    fi
    
    # 先尝试检查依赖是否已存在于Move.toml中
    if grep -q "$src_package = \"0x0\"" "./$target_package/Move.toml"; then
        # 更新Move.toml中的依赖地址
        sed -i.bak "s|$src_package = \"0x0\"|$src_package = \"$package_id\"|g" "./$target_package/Move.toml"
    elif grep -q "$src_package = \"0x[0-9a-f]*\"" "./$target_package/Move.toml"; then
        # 替换已有的不同地址
        sed -i.bak "s|$src_package = \"0x[0-9a-f]*\"|$src_package = \"$package_id\"|g" "./$target_package/Move.toml"
    else
        echo -e "${YELLOW}未找到 $src_package 依赖配置，检查是否使用了本地依赖...${NC}"
        # 检查是否使用本地依赖
        if grep -q "$src_package = { local" "./$target_package/Move.toml"; then
            echo -e "${GREEN}发现本地依赖，无需更新${NC}"
            return 0
        else
            echo -e "${RED}未找到依赖配置，请手动检查${NC}"
            return 1
        fi
    fi
    
    # 删除备份文件
    rm -f "./$target_package/Move.toml.bak"
    
    echo -e "${GREEN}依赖更新完成${NC}"
}

# 部署合约
deploy_contract() {
    local package_dir=$1
    local package_name=$2
    local gas_budget=200000000
    
    echo -e "${BLUE}====== 开始部署 $package_name 合约 ======${NC}"
    
    # 切换到合约目录
    cd $package_dir
    
    # 编译并部署合约
    echo -e "${YELLOW}编译并部署 $package_name 合约...${NC}"
    local deploy_output=$(sui client publish --gas-budget $gas_budget 2>&1)
    local deploy_status=$?
    
    # 检查部署状态
    if [ $deploy_status -ne 0 ]; then
        echo -e "${RED}部署失败: ${NC}"
        echo "$deploy_output"
        cd ..
        return 1
    fi
    
    echo -e "${GREEN}部署成功!${NC}"
    echo "$deploy_output" > deploy_output.txt
    
    # 提取部署交易 Digest
    local deploy_tx=$(echo "$deploy_output" | grep -oE "Transaction Digest: [a-zA-Z0-9]+" | awk '{print $3}')
    echo -e "${YELLOW}部署交易ID: $deploy_tx${NC}"
    
    # 提取 Package ID - 在新版Sui中，Package ID通常是Published Objects部分的第一个ID
    local package_id=$(echo "$deploy_output" | grep -A 10 "Published Objects:" | grep -oE "0x[a-f0-9]+" | head -1)
    echo -e "${GREEN}提取到的Package ID: $package_id${NC}"
    
    if [ -z "$package_id" ]; then
        echo -e "${RED}无法从部署输出提取Package ID${NC}"
        # 尝试从交易详情获取
        echo -e "${YELLOW}尝试从交易详情获取Package ID...${NC}"
        local tx_output=$(sui client tx-block $deploy_tx 2>&1)
        package_id=$(echo "$tx_output" | grep -A 5 "Published" | grep -oE "0x[a-f0-9]+" | head -1)
        if [ -z "$package_id" ]; then
            echo -e "${RED}仍然无法获取Package ID，部署失败${NC}"
            cd ..
            return 1
        else
            echo -e "${GREEN}从交易详情中提取到Package ID: $package_id${NC}"
        fi
    fi
    
    # 导出包ID供后续使用
    # 使用全局变量保存
    export ${package_name}_PACKAGE_ID=$package_id
    
    # 提取模块列表
    local modules=$(echo "$deploy_output" | grep "Published" | grep -oE '[a-zA-Z_]+::' | sed 's/:://g')
    
    # 等待交易确认
    echo -e "${YELLOW}等待交易确认...${NC}"
    sleep 3
    
    # 获取交易详情以提取对象ID
    local tx_details=$(sui client tx-block $deploy_tx 2>&1)
    
    # 保存交易详情
    echo "$tx_details" > tx_details.txt
    
    # 提取资源信息，根据合约类型定制
    local resources=""
    
    # 尝试提取UpgradeCap对象ID
    local upgrade_cap_id=$(echo "$tx_details" | grep -A 5 "UpgradeCap" | grep -oE "0x[a-f0-9]+" | head -1)
    if [ -z "$upgrade_cap_id" ]; then
        # 备用方法
        upgrade_cap_id=$(echo "$deploy_output" | grep -A 5 "UpgradeCap" | grep -oE "0x[a-f0-9]+" | head -1)
    fi
    
    # 提取特定资源ID的函数
    extract_resource_id() {
        local pattern=$1
        local detail_output=$2
        local id=$(echo "$detail_output" | grep -A 5 "$pattern" | grep -oE "0x[a-f0-9]+" | head -1)
        if [ -z "$id" ]; then
            # 尝试从部署输出提取
            id=$(echo "$deploy_output" | grep -A 5 "$pattern" | grep -oE "0x[a-f0-9]+" | head -1)
        fi
        echo "$id"
    }
    
    case $package_name in
        "Coin")
            # 提取代币相关对象
            local btc_metadata_id=$(extract_resource_id "test_btc::TEST_BTC.*Metadata" "$tx_details")
            local btc_treasury_id=$(extract_resource_id "test_btc::TEST_BTC.*Treasury" "$tx_details")
            local sui_metadata_id=$(extract_resource_id "test_sui::TEST_SUI.*Metadata" "$tx_details")
            local sui_treasury_id=$(extract_resource_id "test_sui::TEST_SUI.*Treasury" "$tx_details")
            
            # 导出TreasuryCap ID供铸币使用
            export BTC_TREASURY_CAP=$btc_treasury_id
            export SUI_TREASURY_CAP=$sui_treasury_id
            
            resources="### TEST_BTC 代币
1. **代币元数据**:
   - Object ID: \`$btc_metadata_id\`
   - 所有者: Immutable
   - 精度: 6
   - 符号: testBTC

2. **铸币权限**:
   - Object ID: \`$btc_treasury_id\`
   - 所有者: \`$ADMIN_ADDRESS\`

### TEST_SUI 代币
1. **代币元数据**:
   - Object ID: \`$sui_metadata_id\`
   - 所有者: Immutable
   - 精度: 6
   - 符号: testSUI

2. **铸币权限**:
   - Object ID: \`$sui_treasury_id\`
   - 所有者: \`$ADMIN_ADDRESS\`

### 升级权限
- **UpgradeCap**:
  - Object ID: \`$upgrade_cap_id\`
  - 所有者: \`$ADMIN_ADDRESS\`"
            ;;
            
        "Fund")
            # 提取资金池对象
            local finance_pool_id=$(extract_resource_id "FinancePool" "$tx_details")
            local insurance_cap_id=$(extract_resource_id "InsuranceCapability" "$tx_details")
            local bond_cap_id=$(extract_resource_id "BondCapability" "$tx_details")
            
            # 导出ID供其他合约使用
            export FINANCE_POOL_ID=$finance_pool_id
            export INSURANCE_CAP_ID=$insurance_cap_id
            export BOND_CAP_ID=$bond_cap_id
            
            resources="### 资金池对象
1. **FinancePool**:
   - Object ID: \`$finance_pool_id\`
   - 所有者: Shared
   - 管理员: \`$ADMIN_ADDRESS\`

2. **InsuranceCapability**:
   - Object ID: \`$insurance_cap_id\`
   - 所有者: \`$ADMIN_ADDRESS\`

3. **BondCapability**:
   - Object ID: \`$bond_cap_id\`
   - 所有者: \`$ADMIN_ADDRESS\`

### 升级权限
- **UpgradeCap**:
  - Object ID: \`$upgrade_cap_id\`
  - 所有者: \`$ADMIN_ADDRESS\`"
            ;;
            
        "Insurance")
            # 提取保险合约对象
            local policy_manager_id=$(extract_resource_id "PolicyManager" "$tx_details")
            
            # 导出ID供前端使用
            export POLICY_MANAGER_ID=$policy_manager_id
            
            resources="### 保险管理者对象
1. **PolicyManager**:
   - Object ID: \`$policy_manager_id\`
   - 所有者: Shared
   - 基准费率: 2%
   - 波动性系数: 5%
   - 管理员: \`$ADMIN_ADDRESS\`

### 升级权限
- **UpgradeCap**:
  - Object ID: \`$upgrade_cap_id\`
  - 所有者: \`$ADMIN_ADDRESS\`"
            ;;
            
        "Bond")
            # 提取债券池对象
            local bond_pool_id=$(extract_resource_id "BondPool" "$tx_details")
            local admin_cap_id=$(extract_resource_id "AdminCap" "$tx_details")
            
            # 导出ID供前端使用
            export BOND_POOL_ID=$bond_pool_id
            export BOND_ADMIN_CAP_ID=$admin_cap_id
            
            resources="### 债券池对象
1. **BondPool**:
   - Object ID: \`$bond_pool_id\`
   - 所有者: Shared
   - 管理员: \`$ADMIN_ADDRESS\`

2. **AdminCap**:
   - Object ID: \`$admin_cap_id\`
   - 所有者: \`$ADMIN_ADDRESS\`

### 升级权限
- **UpgradeCap**:
  - Object ID: \`$upgrade_cap_id\`
  - 所有者: \`$ADMIN_ADDRESS\`"
            ;;
            
        "Pool")
            # 提取流动性池对象
            local pool_factory_id=$(extract_resource_id "PoolFactory" "$tx_details")
            
            # 导出ID供前端使用
            export POOL_FACTORY_ID=$pool_factory_id
            
            resources="### 流动性池工厂对象
1. **PoolFactory**:
   - Object ID: \`$pool_factory_id\`
   - 所有者: Shared
   - 管理员: \`$ADMIN_ADDRESS\`

### 升级权限
- **UpgradeCap**:
  - Object ID: \`$upgrade_cap_id\`
  - 所有者: \`$ADMIN_ADDRESS\`"
            ;;
    esac
    
    # 提取Gas成本
    local gas_cost=$(extract_gas_cost "$deploy_output")
    
    # 更新部署记录
    update_deploy_records "$package_name" "$package_id" "$deploy_tx" "$modules" "$resources" "$gas_cost"
    
    # 创建部署日志目录（如果不存在）
    mkdir -p "../$DEPLOY_LOG_DIR"
    
    # 保存完整部署记录
    echo "$deploy_output" > "../$DEPLOY_LOG_DIR/${package_name}_deploy_$TIMESTAMP.log"
    
    # 保存关键信息到JSON日志（根据jq是否可用选择不同的方法）
    if command -v jq &> /dev/null; then
        jq -n \
          --arg timestamp "$TIMESTAMP" \
          --arg package_name "$package_name" \
          --arg package_id "$package_id" \
          --arg deploy_tx "$deploy_tx" \
          --arg upgrade_cap_id "$upgrade_cap_id" \
          '{timestamp: $timestamp, package_name: $package_name, package_id: $package_id, deploy_tx: $deploy_tx, upgrade_cap_id: $upgrade_cap_id}' \
          >> "../$DEPLOY_LOG"
    else
        # 使用备用方法写入JSON
        safe_write_json_log "../$DEPLOY_LOG" "$package_name" "$package_id" "$upgrade_cap_id"
    fi
    
    echo -e "${BLUE}====== $package_name 合约部署完成 ======${NC}\n"
    
    cd ..
}

# 测试文件系统
test_file_system() {
    echo -e "${YELLOW}===== 开始文件系统测试 =====${NC}"
    
    # 检查和创建部署日志目录
    if [ ! -d "./deploy_logs" ]; then
        echo -e "${YELLOW}创建deploy_logs目录...${NC}"
        mkdir -p ./deploy_logs
        if [ ! -d "./deploy_logs" ]; then
            echo -e "${RED}错误: 无法创建deploy_logs目录${NC}"
            return 1
        fi
    fi
    echo -e "${GREEN}✓ deploy_logs目录已存在或成功创建${NC}"
    
    # 测试日志文件写入
    local test_log="./deploy_logs/test_file_$(date +%Y-%m-%d).log"
    echo -e "${YELLOW}测试写入: $test_log${NC}"
    echo "测试内容" > "$test_log"
    if [ ! -s "$test_log" ]; then
        echo -e "${RED}错误: 无法写入日志文件${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ 可以成功写入日志文件${NC}"
    
    # 测试JSON文件写入
    local test_json="./deploy_logs/test_file_$(date +%Y-%m-%d).json"
    echo -e "${YELLOW}测试写入: $test_json${NC}"
    echo '{"test": "success"}' > "$test_json"
    if [ ! -s "$test_json" ]; then
        echo -e "${RED}错误: 无法写入JSON文件${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ 可以成功写入JSON文件${NC}"
    
    # 重置并准备部署记录文件
    echo -e "${YELLOW}准备部署记录文件...${NC}"
    
    # 删除旧的部署记录文件
    rm -f "contract_deploy_newest.md"
    rm -f "contract_deploy_history.md"
    
    # 创建新的空白文件
    echo -e "${YELLOW}创建: contract_deploy_newest.md${NC}"
    touch "contract_deploy_newest.md"
    if [ ! -f "contract_deploy_newest.md" ]; then
        echo -e "${RED}错误: 无法创建contract_deploy_newest.md文件${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}创建: contract_deploy_history.md${NC}"
    touch "contract_deploy_history.md"
    if [ ! -f "contract_deploy_history.md" ]; then
        echo -e "${RED}错误: 无法创建contract_deploy_history.md文件${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ 部署记录文件准备完成${NC}"
    
    # 测试jq命令是否可用
    echo -e "${YELLOW}测试jq命令...${NC}"
    if command -v jq &> /dev/null; then
        echo -e "${GREEN}✓ jq命令可用${NC}"
    else
        echo -e "${YELLOW}⚠️ jq命令不可用，将使用备用方法记录部署信息${NC}"
    fi
    
    # 删除测试文件
    rm -f "$test_log" "$test_json"
    
    echo -e "${GREEN}✓ 文件系统测试通过${NC}"
    echo -e "${YELLOW}=======================${NC}"
    return 0
}

# 安全写入日志函数 - 当jq不可用时使用
safe_write_json_log() {
    local deploy_log=$1
    local package_name=$2
    local contract_id=$3
    local object_id=$4
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    echo "{" > "$deploy_log"
    echo "  \"package_name\": \"$package_name\"," >> "$deploy_log"
    echo "  \"contract_id\": \"$contract_id\"," >> "$deploy_log"
    echo "  \"object_id\": \"$object_id\"," >> "$deploy_log"
    echo "  \"timestamp\": \"$timestamp\"" >> "$deploy_log"
    echo "}" >> "$deploy_log"
    
    echo -e "${GREEN}已保存部署日志到 $deploy_log${NC}"
}

# 主函数
main() {
    # 日期格式化
    local date_str=$(date +%Y-%m-%d)
    
    # 确保日志目录变量设置正确
    DEPLOY_LOG_DIR="./deploy_logs"
    DEPLOY_LOG="$DEPLOY_LOG_DIR/deploy_log_$TIMESTAMP.json"
    
    # 在开始部署前测试文件系统
    test_file_system
    if [ $? -ne 0 ]; then
        echo "文件系统测试失败，终止部署"
        return 1
    fi
    
    # 创建deploy_logs目录（即使测试已经创建，再次确认）
    mkdir -p "$DEPLOY_LOG_DIR"
    
    # 确保历史记录文件已准备好
    if [ ! -f "contract_deploy_newest.md" ] || [ ! -f "contract_deploy_history.md" ]; then
        echo -e "${YELLOW}准备部署记录文件...${NC}"
        # 如果文件不存在，确保创建
        touch contract_deploy_newest.md
        touch contract_deploy_history.md
        
        # 初始化文件内容
        echo "# 最新合约部署记录" > contract_deploy_newest.md
        echo -e "\n" >> contract_deploy_newest.md
        
        echo "# 历史合约部署记录" > contract_deploy_history.md  
        echo -e "\n" >> contract_deploy_history.md
        
        echo -e "${GREEN}已创建部署记录文件${NC}"
    fi

    echo -e "${BLUE}开始部署 HashCAT 合约...${NC}"
    echo -e "${YELLOW}部署日志将保存到 $DEPLOY_LOG${NC}"
    
    # 部署顺序: Coin -> Fund -> Insurance -> Bond -> Pool
    
    # 第一步: 部署Coin合约
    deploy_contract "./coin" "Coin"
    if [ $? -ne 0 ]; then 
        echo -e "${RED}Coin合约部署失败，中止部署流程${NC}" 
        exit 1
    fi
    
    # 检查Coin合约ID是否成功设置
    if [ -z "$Coin_PACKAGE_ID" ]; then
        echo -e "${RED}无法获取Coin合约ID，中止部署流程${NC}"
        exit 1
    fi
    echo -e "${GREEN}准备使用Coin合约ID: $Coin_PACKAGE_ID${NC}"
    
    # 更新Fund合约对Coin合约的依赖
    update_dependencies "hashcat_coin" "fund" "$Coin_PACKAGE_ID"
    
    # 第二步: 部署Fund合约
    deploy_contract "./fund" "Fund"
    if [ $? -ne 0 ]; then 
        echo -e "${RED}Fund合约部署失败，中止部署流程${NC}" 
        exit 1
    fi
    
    # 检查Fund合约ID是否成功设置
    if [ -z "$Fund_PACKAGE_ID" ]; then
        echo -e "${RED}无法获取Fund合约ID，中止部署流程${NC}"
        exit 1
    fi
    echo -e "${GREEN}准备使用Fund合约ID: $Fund_PACKAGE_ID${NC}"
    
    # 更新Insurance合约的依赖
    update_dependencies "hashcat_coin" "insurance" "$Coin_PACKAGE_ID"
    update_dependencies "hashcat_fund" "insurance" "$Fund_PACKAGE_ID"
    
    # 第三步: 部署Insurance合约
    deploy_contract "./insurance" "Insurance"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Insurance合约部署失败，但继续部署下一个合约${NC}"
    fi
    
    # 更新Bond合约的依赖
    update_dependencies "hashcat_coin" "bond" "$Coin_PACKAGE_ID"
    update_dependencies "hashcat_fund" "bond" "$Fund_PACKAGE_ID"
    
    # 第四步: 部署Bond合约
    deploy_contract "./bond" "Bond"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Bond合约部署失败，但继续部署下一个合约${NC}"
    fi
    
    # 更新Pool合约的依赖
    update_dependencies "hashcat_coin" "pool" "$Coin_PACKAGE_ID"
    
    # 第五步: 部署流动性池合约
    deploy_contract "./pool" "Pool"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Pool合约部署失败${NC}"
    fi
    
    echo -e "${GREEN}所有合约部署完成!${NC}"
    echo -e "${YELLOW}部署日志已保存到 $DEPLOY_LOG_DIR 目录${NC}"
}

# 调用主函数
main