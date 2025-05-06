/**
 * 灵魂绑定代币(SBT)模块
 * 实现不可转让的数字凭证，用于证明用户身份或成就
 */
module chain_contract::sbt;

use std::string::{Self, String};
use sui::display;
use sui::event;
use sui::object::{Self, UID};
use sui::package;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// ===== 错误代码 =====
/// SBT不允许转移错误
const ESoulboundTransferNotAllowed: u64 = 1;
/// 非拥有者操作错误
const ENotOwner: u64 = 2;
/// 未达到铸造条件
const EConditionNotMet: u64 = 3;

// ===== 类型定义 =====
/**
     * SBT主对象，由用户拥有
     * 代表一个不可转让的灵魂绑定代币
     */
// public struct SoulboundToken has key, store {
public struct SoulboundToken has key {
    id: UID,
    /// SBT名称
    name: String,
    /// SBT描述
    description: String,
    /// 元数据URL（如图像）
    url: String,
    /// 发行者地址
    issuer: address,
    /// 其他自定义属性
    attributes: Table<String, String>,
}

/**
     * 发布者凭证，用于验证发布者身份
     * 持有此凭证的地址有权铸造新的SBT
     */
public struct IssuerCap has key, store {
    id: UID,
    /// 发行者地址
    issuer: address,
}

/**
     * 一次性见证对象，用于初始化
     * 仅在模块部署时使用一次
     */
public struct SBT has drop {}

// ===== 事件 =====
/**
     * 当SBT被铸造时发出的事件
     * 记录铸造情况供链下应用查询
     */
public struct SBTMinted has copy, drop {
    /// 代币ID（对象地址）
    id: address,
    /// 接收者地址
    recipient: address,
    /// 代币名称
    name: String,
}

// ===== 模块初始化 =====
/**
     * 初始化SBT模块
     * 在部署时执行一次，设置显示规则并创建发行者凭证
     * @param otw - 一次性见证对象
     * @param ctx - 交易上下文
     */
fun init(otw: SBT, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    // 创建显示信息字段
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
        string::utf8(b"issuer"),
    ];

    // 创建显示信息的值映射
    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"{url}"),
        string::utf8(b"{issuer}"),
    ];

    // 创建Display对象，用于NFT展示
    let mut display_obj = display::new_with_fields<SoulboundToken>(
        &publisher,
        keys,
        values,
        ctx,
    );
    display::update_version(&mut display_obj);
    transfer::public_transfer(display_obj, tx_context::sender(ctx));

    // 转移发布者对象，使其不再可访问
    transfer::public_transfer(publisher, tx_context::sender(ctx));

    // 创建并转移发行者凭证给模块部署者
    let issuer_cap = IssuerCap {
        id: object::new(ctx),
        issuer: tx_context::sender(ctx),
    };
    transfer::transfer(issuer_cap, tx_context::sender(ctx));
}

// ===== 公共函数 =====
/**
     * 铸造一个新的SBT
     * 只有发行者能铸造SBT，代币直接转移给接收者
     * @param issuer_cap - 发行者凭证
     * @param name - SBT名称
     * @param description - SBT描述
     * @param url - 元数据URL
     * @param recipient - 接收者地址
     * @param ctx - 交易上下文
     */
public entry fun mint(
    issuer_cap: &IssuerCap,
    name: String,
    description: String,
    url: String,
    recipient: address,
    ctx: &mut TxContext,
) {
    // 创建属性表
    let attributes = table::new<String, String>(ctx);

    // 创建SBT对象
    let sbt = SoulboundToken {
        id: object::new(ctx),
        name,
        description,
        url,
        issuer: issuer_cap.issuer,
        attributes,
    };

    // 发出铸造事件
    event::emit(SBTMinted {
        id: object::uid_to_address(&sbt.id),
        recipient,
        name: sbt.name,
    });

    // 直接转移给接收者
    transfer::transfer(sbt, recipient);
}

/**
     * 用户自助铸造成就SBT
     * 允许用户在完成所有测验后自己铸造成就SBT
     * 此函数不需要IssuerCap，但需要传入quiz_score和total_questions以验证条件
     * 
     * @param name - SBT名称
     * @param description - SBT描述
     * @param url - 元数据URL
     * @param quiz_score - 用户的测验得分
     * @param total_questions - 测验的总题目数
     * @param ctx - 交易上下文
     */
public entry fun self_mint_achievement(
    name: String,
    description: String,
    url: String,
    quiz_score: u64,
    total_questions: u64,
    ctx: &mut TxContext,
) {
    // 验证条件：分数必须等于总题目数（即全部答对）
    assert!(quiz_score == total_questions && total_questions > 0, EConditionNotMet);

    // 创建属性表
    let mut attributes = table::new<String, String>(ctx);

    // 添加成就相关属性（使用预定义的字符串值，而不是尝试转换数字）
    table::add(&mut attributes, string::utf8(b"quiz_score"), string::utf8(b"perfect_score"));
    table::add(&mut attributes, string::utf8(b"total_questions"), string::utf8(b"all_correct"));
    table::add(&mut attributes, string::utf8(b"achievement_type"), string::utf8(b"quiz_master"));

    // 获取交易发送者
    let recipient = tx_context::sender(ctx);

    // 创建SBT对象
    let sbt = SoulboundToken {
        id: object::new(ctx),
        name,
        description,
        url,
        issuer: recipient, // 自助铸造的情况下，发行者就是用户自己
        attributes,
    };

    // 发出铸造事件
    event::emit(SBTMinted {
        id: object::uid_to_address(&sbt.id),
        recipient,
        name: sbt.name,
    });

    // 直接转移给用户自己
    transfer::transfer(sbt, recipient);
}

/**
     * 添加SBT属性，仅所有者可调用
     * @param sbt - SBT对象
     * @param name - 属性名称
     * @param value - 属性值
     * @param ctx - 交易上下文
     */
public entry fun add_attribute(
    sbt: &mut SoulboundToken,
    name: String,
    value: String,
    ctx: &mut TxContext,
) {
    // 由于无法直接获取对象所有者，我们使用交易发送者作为授权
    // 这里的前提是交易必须由SBT所有者发起
    let _sender = tx_context::sender(ctx);

    // 添加或更新属性
    table::add(&mut sbt.attributes, name, value);
}

/**
     * 查询SBT的属性值
     * @param sbt - SBT对象
     * @param name - 属性名称
     * @return 属性值
     */
public fun get_attribute(sbt: &SoulboundToken, name: &String): String {
    *table::borrow(&sbt.attributes, *name)
}

/**
     * 验证是否存在某个属性
     * @param sbt - SBT对象
     * @param name - 属性名称
     * @return 是否存在该属性
     */
public fun has_attribute(sbt: &SoulboundToken, name: &String): bool {
    table::contains(&sbt.attributes, *name)
}

/**
     * 获取SBT的名称
     * @param sbt - SBT对象
     * @return SBT名称
     */
public fun name(sbt: &SoulboundToken): String {
    sbt.name
}

/**
     * 获取SBT的描述
     * @param sbt - SBT对象
     * @return SBT描述
     */
public fun description(sbt: &SoulboundToken): String {
    sbt.description
}

/**
     * 获取SBT的URL
     * @param sbt - SBT对象
     * @return SBT的元数据URL
     */
public fun url(sbt: &SoulboundToken): String {
    sbt.url
}

/**
     * 获取SBT的发行者
     * @param sbt - SBT对象
     * @return 发行者地址
     */
public fun issuer(sbt: &SoulboundToken): address {
    sbt.issuer
}
