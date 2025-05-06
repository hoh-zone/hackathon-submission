/**
 * LearnChain-X 系统核心合约
 * 此模块负责整个系统的配置管理和版本控制
 */
module chain_contract::chain_contract;

use std::string::{Self, String};
use sui::object::{Self, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// 错误码
/// 当操作者不是系统管理员时返回此错误
const ENotAuthorized: u64 = 0;

/**
     * 系统配置结构
     * 存储系统的全局参数和配置信息
     */
public struct SystemConfig has key {
    id: UID,
    /// 系统当前版本号，用于版本控制
    version: u64,
    /// 系统名称
    name: String,
    /// 系统管理员地址，只有管理员可以更改系统设置
    admin: address,
    /// 系统动态参数表，可存储各种配置值
    params: Table<String, String>,
}

/**
     * 初始化系统配置
     * 在模块部署时自动执行一次
     * 创建系统配置对象并设置默认参数
     */
fun init(ctx: &mut TxContext) {
    let params = table::new<String, String>(ctx);

    // 添加默认系统参数
    // 答题奖励积分的最小值
    // table::add(&mut params, string::utf8(b"min_reward"), string::utf8(b"1"));
    // // 答题奖励积分的最大值
    // table::add(&mut params, string::utf8(b"max_reward"), string::utf8(b"100"));
    // // 查看解析所需的最低积分成本
    // table::add(&mut params, string::utf8(b"min_solution_cost"), string::utf8(b"5"));

    // 创建系统配置对象
    let config = SystemConfig {
        id: object::new(ctx),
        version: 1, // 初始版本号为1
        name: string::utf8(b"LearnChain-X Quiz System"),
        admin: tx_context::sender(ctx), // 部署者成为初始管理员
        params,
    };

    // 共享系统配置对象，使其全局可访问
    transfer::share_object(config);
}

/**
     * 更新系统参数
     * @param config - 系统配置对象
     * @param param_name - 参数名称
     * @param param_value - 参数值
     * @param ctx - 交易上下文
     */
public entry fun update_param(
    config: &mut SystemConfig,
    param_name: String,
    param_value: String,
    ctx: &mut TxContext,
) {
    // 验证调用者是否为系统管理员
    assert!(tx_context::sender(ctx) == config.admin, ENotAuthorized);

    // 检查参数是否已存在
    if (table::contains(&config.params, param_name)) {
        // 更新现有参数值
        *table::borrow_mut(&mut config.params, param_name) = param_value;
    } else {
        // 添加新参数
        table::add(&mut config.params, param_name, param_value);
    }
}

/**
     * 更新系统版本号
     * @param config - 系统配置对象
     * @param new_version - 新版本号
     * @param ctx - 交易上下文
     */
public entry fun update_version(config: &mut SystemConfig, new_version: u64, ctx: &mut TxContext) {
    // 验证调用者是否为系统管理员
    assert!(tx_context::sender(ctx) == config.admin, ENotAuthorized);
    // 确保新版本号大于当前版本号（版本只能递增）
    assert!(new_version > config.version, ENotAuthorized);

    // 更新版本号
    config.version = new_version;
}

/**
     * 更新系统管理员
     * @param config - 系统配置对象
     * @param new_admin - 新管理员地址
     * @param ctx - 交易上下文
     */
public entry fun update_admin(config: &mut SystemConfig, new_admin: address, ctx: &mut TxContext) {
    // 验证调用者是否为当前系统管理员
    assert!(tx_context::sender(ctx) == config.admin, ENotAuthorized);

    // 更新管理员地址
    config.admin = new_admin;
}

/**
     * 获取系统当前版本号
     * @param config - 系统配置对象
     * @return 当前版本号
     */
public fun get_version(config: &SystemConfig): u64 {
    config.version
}

/**
     * 获取系统名称
     * @param config - 系统配置对象
     * @return 系统名称
     */
public fun get_name(config: &SystemConfig): String {
    config.name
}

/**
     * 获取指定系统参数的值
     * @param config - 系统配置对象
     * @param param_name - 参数名称
     * @return 参数值
     */
public fun get_param(config: &SystemConfig, param_name: &String): String {
    assert!(table::contains(&config.params, *param_name), 1);
    *table::borrow(&config.params, *param_name)
}

/**
     * 检查指定地址是否为系统管理员
     * @param config - 系统配置对象
     * @param addr - 待检查的地址
     * @return 是否为管理员
     */
public fun is_admin(config: &SystemConfig, addr: address): bool {
    config.admin == addr
}
