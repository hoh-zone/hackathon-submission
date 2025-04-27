#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import glob
from datetime import datetime

# 目录和文件路径
deploy_logs_dir = "/Users/arui/Web3Projects/HashCAT/contracts/deploy_logs"
newest_md_file = "/Users/arui/Web3Projects/HashCAT/contracts/contract_deploy_newest.md"
log_pattern = r"(\w+)_deploy_\d{4}-\d{2}-\d{2}\.log"

def extract_info_from_log(log_file, contract_name):
    """从日志文件中提取部署信息"""
    print(f"处理文件: {log_file}")
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取交易哈希 - 这个相对简单明确
        tx_digest_match = re.search(r"Transaction Digest: ([a-zA-Z0-9]+)", content)
        tx_digest = tx_digest_match.group(1) if tx_digest_match else "未知"
        print(f"交易哈希: {tx_digest}")
        
        # 提取Package ID - 尝试多种模式
        package_id = "未知"
        
        # 模式1：从部署交易输出中提取
        published_match = re.search(r"Published Objects:.*?\n\s*(0x[a-f0-9]+)", content, re.DOTALL)
        if published_match:
            package_id = published_match.group(1)
            print(f"找到Package ID (模式1): {package_id}")
        
        # 模式2：寻找"Package ID:"后面的ID
        if package_id == "未知":
            package_id_match = re.search(r"Package ID: (0x[a-f0-9]+)", content)
            if package_id_match:
                package_id = package_id_match.group(1)
                print(f"找到Package ID (模式2): {package_id}")
        
        # 模式3：从部署日志中提取
        if package_id == "未知":
            package_line = re.search(r"提取到的Package ID: (0x[a-f0-9]+)", content)
            if package_line:
                package_id = package_line.group(1)
                print(f"找到Package ID (模式3): {package_id}")
        
        # 提取对象信息 - 更强大的方法
        objects = []
        
        # 首先打印文件的一部分，用于调试
        first_1000_chars = content[:1000].replace("\n", "\\n")
        print(f"文件前1000字符: {first_1000_chars}")
        
        # 尝试从资源部分提取对象
        resource_section_match = re.search(r"(?:### [^\n]+代币|### [^\n]+对象)(.*?)(?=###|$)", content, re.DOTALL)
        if resource_section_match:
            resource_section = resource_section_match.group(1)
            print(f"找到资源部分: {resource_section[:100]}...")
            
            # 从资源部分提取对象ID和所有者
            object_blocks = re.finditer(r"\*\*([^:]+)\*\*:\s*`(0x[a-f0-9]+)`.*?所有者: ([^\n]*)", resource_section, re.DOTALL)
            
            for obj_match in object_blocks:
                obj_name = obj_match.group(1).strip()
                obj_id = obj_match.group(2).strip()
                owner_info = obj_match.group(3).strip()
                
                owner_type = "未知"
                owner_address = ""
                
                if "Immutable" in owner_info:
                    owner_type = "Immutable"
                elif "Shared" in owner_info:
                    owner_type = "Shared"
                elif re.search(r'`(0x[a-f0-9]+)`', owner_info):
                    owner_type = "Account"
                    owner_address_match = re.search(r'`(0x[a-f0-9]+)`', owner_info)
                    if owner_address_match:
                        owner_address = owner_address_match.group(1)
                
                print(f"从资源部分找到对象: {obj_name} = {obj_id}, 所有者: {owner_type}")
                objects.append({
                    "object_id": obj_id,
                    "object_type": f"{contract_name.lower()}::{obj_name}",
                    "short_type": obj_name,
                    "owner_type": owner_type,
                    "owner_address": owner_address
                })
        
        # 如果没有从资源部分找到对象，尝试从交易输出中提取
        if not objects:
            print("尝试从交易输出中提取对象...")
            
            # 尝试在交易输出中定位创建的对象部分
            created_objects_section = re.search(r"Created Objects:(.*?)(?=\n\n|\nExecuted|$)", content, re.DOTALL)
            if created_objects_section:
                objects_text = created_objects_section.group(1)
                print(f"找到Created Objects部分: {objects_text[:100]}...")
                
                # 查找所有对象条目
                object_entries = re.finditer(r"(0x[a-f0-9]+).*?([A-Za-z0-9_]+::[A-Za-z0-9_]+).*?(Owner|owner): ([A-Za-z]+)(?:.*?Address: (0x[a-f0-9]+))?", objects_text, re.DOTALL | re.IGNORECASE)
                
                for entry in object_entries:
                    obj_id = entry.group(1)
                    obj_type = entry.group(2)
                    owner_type = entry.group(4).capitalize()
                    owner_address = entry.group(5) if entry.groups() > 4 and entry.group(5) else ""
                    
                    short_type = obj_type.split("::")[-1] if "::" in obj_type else obj_type
                    
                    print(f"从Created Objects找到对象: {obj_id} ({short_type}), 所有者: {owner_type}")
                    objects.append({
                        "object_id": obj_id,
                        "object_type": obj_type,
                        "short_type": short_type,
                        "owner_type": owner_type,
                        "owner_address": owner_address
                    })
        
        # 第三种方法：直接搜索合约特定的对象
        if not objects:
            print("使用特定对象模式...")
            
            # 特定对象类型的搜索模式
            object_patterns = {
                "Coin": [
                    (r"TEST_BTC.*?Metadata.*?Object ID: (0x[a-f0-9]+)", "TEST_BTC_Metadata", "Immutable"),
                    (r"TEST_BTC.*?Treasury.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", "TEST_BTC_TreasuryCap", "Account"),
                    (r"TEST_SUI.*?Metadata.*?Object ID: (0x[a-f0-9]+)", "TEST_SUI_Metadata", "Immutable"),
                    (r"TEST_SUI.*?Treasury.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", "TEST_SUI_TreasuryCap", "Account")
                ],
                "Fund": [
                    (r"FinancePool.*?Object ID: (0x[a-f0-9]+)", "FinancePool", "Shared"),
                    (r"InsuranceCapability.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", "InsuranceCapability", "Account"),
                    (r"BondCapability.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", "BondCapability", "Account")
                ],
                "Insurance": [
                    (r"PolicyManager.*?Object ID: (0x[a-f0-9]+)", "PolicyManager", "Shared")
                ],
                "Bond": [
                    (r"BondPool.*?Object ID: (0x[a-f0-9]+)", "BondPool", "Shared"),
                    (r"AdminCap.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", "AdminCap", "Account")
                ],
                "Pool": [
                    (r"PoolFactory.*?Object ID: (0x[a-f0-9]+)", "PoolFactory", "Shared")
                ]
            }
            
            # 根据合约类型使用相应的模式
            if contract_name in object_patterns:
                for pattern_info in object_patterns[contract_name]:
                    pattern, short_type, owner_type = pattern_info
                    
                    matches = re.finditer(pattern, content, re.DOTALL)
                    for match in matches:
                        obj_id = match.group(1)
                        owner_address = match.group(2) if match.groups() > 1 and owner_type == "Account" else ""
                        
                        print(f"使用特定模式找到对象: {obj_id} ({short_type})")
                        objects.append({
                            "object_id": obj_id,
                            "object_type": f"{contract_name.lower()}::{short_type}",
                            "short_type": short_type,
                            "owner_type": owner_type,
                            "owner_address": owner_address
                        })
            
            # 寻找UpgradeCap对象
            upgrade_cap_match = re.search(r"UpgradeCap.*?Object ID: (0x[a-f0-9]+).*?Address: (0x[a-f0-9]+)", content, re.DOTALL)
            if upgrade_cap_match:
                obj_id = upgrade_cap_match.group(1)
                owner_address = upgrade_cap_match.group(2)
                
                print(f"找到UpgradeCap对象: {obj_id}")
                objects.append({
                    "object_id": obj_id,
                    "object_type": "sui::package::UpgradeCap",
                    "short_type": "UpgradeCap",
                    "owner_type": "Account",
                    "owner_address": owner_address
                })
        
        # 第四种方法：直接从deploy.sh输出提取
        if not objects:
            print("从deploy.sh输出提取资源...")
            
            # 提取资源部分
            resources_section = re.search(r"resources=\"(.*?)\"", content, re.DOTALL)
            if resources_section:
                resources_text = resources_section.group(1)
                print(f"找到resources部分: {resources_text[:100]}...")
                
                # 从资源文本中提取对象
                object_id_entries = re.finditer(r"Object ID: `(0x[a-f0-9]+)`.*?所有者: ([^\n]*)", resources_text, re.DOTALL)
                
                for entry in object_id_entries:
                    obj_id = entry.group(1)
                    owner_info = entry.group(2)
                    
                    # 尝试确定对象类型和所有者
                    owner_type = "未知"
                    owner_address = ""
                    short_type = "未知对象"
                    
                    # 从上下文确定对象类型
                    context_before = resources_text[:entry.start()].split("\n")[-3:]
                    context_text = "\n".join(context_before)
                    
                    if "TreasuryCap" in context_text or "铸币权限" in context_text:
                        short_type = "TreasuryCap"
                    elif "Metadata" in context_text or "元数据" in context_text:
                        short_type = "Metadata"
                    elif "FinancePool" in context_text:
                        short_type = "FinancePool"
                    elif "InsuranceCapability" in context_text:
                        short_type = "InsuranceCapability"
                    elif "BondCapability" in context_text:
                        short_type = "BondCapability"
                    elif "PolicyManager" in context_text:
                        short_type = "PolicyManager"
                    elif "BondPool" in context_text:
                        short_type = "BondPool"
                    elif "AdminCap" in context_text:
                        short_type = "AdminCap"
                    elif "PoolFactory" in context_text:
                        short_type = "PoolFactory"
                    elif "UpgradeCap" in context_text:
                        short_type = "UpgradeCap"
                    
                    # 确定所有者类型
                    if "Immutable" in owner_info:
                        owner_type = "Immutable"
                    elif "Shared" in owner_info:
                        owner_type = "Shared"
                    elif re.search(r'`(0x[a-f0-9]+)`', owner_info):
                        owner_type = "Account"
                        owner_address_match = re.search(r'`(0x[a-f0-9]+)`', owner_info)
                        if owner_address_match:
                            owner_address = owner_address_match.group(1)
                    
                    print(f"从resources变量找到对象: {obj_id} ({short_type}), 所有者: {owner_type}")
                    objects.append({
                        "object_id": obj_id,
                        "object_type": f"{contract_name.lower()}::{short_type}",
                        "short_type": short_type,
                        "owner_type": owner_type,
                        "owner_address": owner_address
                    })
        
        # 如果仍然没有找到对象，尝试直接从所有文本中提取
        if not objects:
            print("最后尝试：直接从全文提取对象信息...")
            all_object_ids = re.findall(r"Object ID: (0x[a-f0-9]+)", content)
            
            for obj_id in all_object_ids:
                # 获取对象ID周围的上下文
                context_match = re.search(r".{0,200}" + re.escape(obj_id) + r".{0,200}", content)
                if context_match:
                    context = context_match.group(0)
                    
                    # 尝试确定对象类型
                    obj_type = "未知类型"
                    if "TreasuryCap" in context:
                        obj_type = "TreasuryCap"
                    elif "Metadata" in context:
                        obj_type = "Metadata"
                    elif "FinancePool" in context:
                        obj_type = "FinancePool"
                    elif "InsuranceCapability" in context:
                        obj_type = "InsuranceCapability"
                    elif "BondCapability" in context:
                        obj_type = "BondCapability"
                    elif "PolicyManager" in context:
                        obj_type = "PolicyManager"
                    elif "BondPool" in context:
                        obj_type = "BondPool"
                    elif "AdminCap" in context:
                        obj_type = "AdminCap"
                    elif "PoolFactory" in context:
                        obj_type = "PoolFactory"
                    elif "UpgradeCap" in context:
                        obj_type = "UpgradeCap"
                    
                    # 简单确定所有者类型
                    owner_type = "未知"
                    owner_address = ""
                    
                    if "Owner: Immutable" in context or "Immutable" in context:
                        owner_type = "Immutable"
                    elif "Owner: Shared" in context or "Shared" in context:
                        owner_type = "Shared"
                    elif "Owner: Account" in context:
                        owner_type = "Account"
                        addr_match = re.search(r"Address: (0x[a-f0-9]+)", context)
                        if addr_match:
                            owner_address = addr_match.group(1)
                    
                    print(f"最终方法找到对象: {obj_id} ({obj_type})")
                    
                    # 避免添加已存在的对象
                    if not any(obj["object_id"] == obj_id for obj in objects):
                        objects.append({
                            "object_id": obj_id,
                            "object_type": f"{contract_name.lower()}::{obj_type}",
                            "short_type": obj_type,
                            "owner_type": owner_type,
                            "owner_address": owner_address
                        })
        
        # 使用文件名中的日期作为时间戳
        timestamp_match = re.search(r"_(\d{4}-\d{2}-\d{2})\.log", os.path.basename(log_file))
        timestamp = timestamp_match.group(1) if timestamp_match else datetime.now().strftime("%Y-%m-%d")
        
        # 打印最终提取的信息
        print(f"合约: {contract_name}")
        print(f"Package ID: {package_id}")
        print(f"交易哈希: {tx_digest}")
        print(f"找到 {len(objects)} 个对象:")
        for obj in objects:
            print(f"  - {obj['short_type']}: {obj['object_id']} (所有者: {obj['owner_type']})")
        
        return {
            "contract_name": contract_name,
            "package_id": package_id,
            "tx_digest": tx_digest,
            "objects": objects,
            "timestamp": timestamp
        }
    except Exception as e:
        print(f"处理文件 {log_file} 时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "contract_name": contract_name,
            "package_id": "解析错误",
            "tx_digest": "解析错误",
            "objects": [],
            "timestamp": datetime.now().strftime("%Y-%m-%d")
        }

def generate_markdown(contract_data_list):
    """生成Markdown格式的部署记录"""
    md_content = "# 最新合约部署记录\n\n"
    
    # 按合约排序生成内容
    contract_order = {"Coin": 1, "Fund": 2, "Insurance": 3, "Bond": 4, "Pool": 5}
    sorted_data = sorted(contract_data_list, key=lambda x: contract_order.get(x["contract_name"], 99))
    
    for contract_data in sorted_data:
        contract_name = contract_data["contract_name"]
        package_id = contract_data["package_id"]
        tx_digest = contract_data["tx_digest"]
        timestamp = contract_data["timestamp"]
        objects = contract_data["objects"]
        
        md_content += f"## {contract_name} 合约\n"
        md_content += f"**部署时间**: {timestamp}\n"
        md_content += f"**网络**: Sui Testnet\n"
        md_content += f"**部署交易**: `{tx_digest}`\n\n"
        
        md_content += "### 合约地址\n"
        md_content += f"- **Package ID**: `{package_id}`\n"
        md_content += "- **模块列表**: 合约核心模块\n\n"
        
        if objects:
            md_content += "### 合约对象\n"
            
            # 分类对象
            categorized_objects = {}
            for obj in objects:
                short_type = obj["short_type"]
                if short_type not in categorized_objects:
                    categorized_objects[short_type] = []
                categorized_objects[short_type].append(obj)
            
            # 按对象类型分组显示
            for obj_type, obj_list in categorized_objects.items():
                md_content += f"#### {obj_type}\n"
                for i, obj in enumerate(obj_list, 1):
                    md_content += f"{i}. **Object ID**: `{obj['object_id']}`\n"
                    md_content += f"   - 类型: `{obj['object_type']}`\n"
                    if obj["owner_type"] == "Account" and obj["owner_address"]:
                        md_content += f"   - 所有者: `{obj['owner_address']}` (账户)\n"
                    elif obj["owner_type"] == "Shared":
                        md_content += f"   - 所有者: Shared (共享对象)\n"
                    elif obj["owner_type"] == "Immutable":
                        md_content += f"   - 所有者: Immutable (不可变对象)\n"
                    else:
                        md_content += f"   - 所有者: {obj['owner_type']}\n"
                md_content += "\n"
        
        md_content += "### 验证步骤\n"
        md_content += "1. 在 Sui Explorer 中查看交易：\n"
        md_content += "   ```\n"
        md_content += f"   https://suiexplorer.com/txblock/{tx_digest}\n"
        md_content += "   ```\n\n"
    
    return md_content

def main():
    print("开始解析部署日志...")
    contract_data_list = []
    
    # 只处理.log文件
    log_files = glob.glob(os.path.join(deploy_logs_dir, "*_deploy_*.log"))
    print(f"找到 {len(log_files)} 个日志文件")
    
    for log_file in log_files:
        file_name = os.path.basename(log_file)
        contract_match = re.match(log_pattern, file_name)
        if contract_match:
            contract_name = contract_match.group(1)
            print(f"\n处理 {contract_name} 合约的日志...")
            contract_data = extract_info_from_log(log_file, contract_name)
            contract_data_list.append(contract_data)
    
    if not contract_data_list:
        print("错误：未能从日志文件中提取任何合约数据!")
        return
    
    # 生成Markdown内容
    print("\n生成Markdown内容...")
    md_content = generate_markdown(contract_data_list)
    
    # 写入文件
    print(f"\n写入到 {newest_md_file}...")
    with open(newest_md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"已成功将部署信息写入 {newest_md_file} 文件")

if __name__ == "__main__":
    main()
