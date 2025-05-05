/**
 * SBT批量操作脚本模块
 * 提供批量铸造SBT和批量添加属性的便捷功能
 */
module chain_contract::sbt_scripts;

use chain_contract::sbt::{Self, IssuerCap};
use std::string::{Self, String};
use std::vector;
use sui::tx_context::{Self, TxContext};

/**
     * 使用发行者凭证批量铸造SBT给多个用户
     * 一次操作可以为多个接收者创建多个SBT，提高效率
     * 
     * @param cap - 发行者凭证，用于验证铸造权限
     * @param names - SBT名称列表
     * @param descriptions - SBT描述列表
     * @param urls - SBT图像URL列表
     * @param recipients - 接收者地址列表
     * @param ctx - 交易上下文
     */
public entry fun batch_mint(
    cap: &IssuerCap,
    names: vector<String>,
    descriptions: vector<String>,
    urls: vector<String>,
    recipients: vector<address>,
    ctx: &mut TxContext,
) {
    let len = vector::length(&names);

    // 验证所有输入向量长度一致
    assert!(
        vector::length(&descriptions) == len && 
            vector::length(&urls) == len && 
            vector::length(&recipients) == len,
        0, // 输入长度不一致错误
    );

    // 循环为每个接收者铸造SBT
    let mut i = 0;
    while (i < len) {
        sbt::mint(
            cap,
            *vector::borrow(&names, i),
            *vector::borrow(&descriptions, i),
            *vector::borrow(&urls, i),
            *vector::borrow(&recipients, i),
            ctx,
        );
        i = i + 1;
    }
}

/**
     * 为SBT添加多个属性
     * 批量为一个SBT添加多个名称-值对属性
     * 
     * @param token - 要添加属性的SBT
     * @param names - 属性名称列表
     * @param values - 属性值列表
     * @param ctx - 交易上下文
     */
public entry fun add_multiple_attributes(
    token: &mut sbt::SoulboundToken,
    names: vector<String>,
    values: vector<String>,
    ctx: &mut TxContext,
) {
    let len = vector::length(&names);

    // 验证所有输入向量长度一致
    assert!(vector::length(&values) == len, 0);

    // 循环添加每个属性
    let mut i = 0;
    while (i < len) {
        sbt::add_attribute(
            token,
            *vector::borrow(&names, i),
            *vector::borrow(&values, i),
            ctx,
        );
        i = i + 1;
    }
}
