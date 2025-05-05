/**
 * 零知识证明验证器
 * 用于验证用户的能力证明，而不暴露具体信息
 */
module chain_contract::zk_verifier;

use std::string::{Self, String};
use sui::event;
use sui::object::{Self, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// ===== 错误代码 =====
/// 验证失败错误
const EVerificationFailed: u64 = 1;
/// 非授权操作错误
const ENotAuthorized: u64 = 2;
/// 验证密钥不存在错误
const EVerificationKeyNotFound: u64 = 3;

// ===== 类型定义 =====

/// 零知识证明验证器对象，用于存储和管理验证密钥
public struct ZkVerifier has key {
    id: UID,
    /// 管理员地址
    admin: address,
    /// 验证密钥，电路名称 -> 验证密钥JSON字符串
    verification_keys: Table<String, String>,
}

// ===== 事件 =====

/// 验证结果事件
public struct VerificationResult has copy, drop {
    /// 用户地址
    user: address,
    /// 电路名称
    circuit_name: String,
    /// 验证是否通过
    is_verified: bool,
    /// 要求等级
    required_level: u64,
}

/// 验证密钥添加事件
public struct VerificationKeyAdded has copy, drop {
    /// 管理员地址
    admin: address,
    /// 电路名称
    circuit_name: String,
}

// ===== 初始化 =====

/// 创建验证器对象
public entry fun create_verifier(ctx: &mut TxContext) {
    let verifier = ZkVerifier {
        id: object::new(ctx),
        admin: tx_context::sender(ctx),
        verification_keys: table::new(ctx),
    };
    
    // 共享验证器对象，使其全局可访问
    transfer::share_object(verifier);
}
fun init(ctx: &mut TxContext) {
    // 创建验证器对象并共享
    let verifier = ZkVerifier {
        id: object::new(ctx),
        // admin: tx_context::sender(ctx),
        admin: @0xe75a090888082e699c99b6877f93aaacedba68cd172f32006605e76b99260bb8,
        verification_keys: table::new(ctx),
    };
    
    transfer::share_object(verifier);
}
// ===== 公共函数 =====

/// 添加验证密钥
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @param verification_key - 验证密钥JSON字符串
/// @param ctx - 交易上下文
public entry fun add_verification_key(
    verifier: &mut ZkVerifier,
    circuit_name: String,
    verification_key: String,
    ctx: &mut TxContext,
) {
    // 验证调用者是管理员
    assert!(tx_context::sender(ctx) == verifier.admin, ENotAuthorized);
    
    // 添加验证密钥
    table::add(&mut verifier.verification_keys, circuit_name, verification_key);
    
    // 发出事件
    event::emit(VerificationKeyAdded {
        admin: verifier.admin,
        circuit_name,
    });
}

/// 验证零知识证明
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @param proof - 证明字符串
/// @param public_inputs - 公共输入字符串，包含要求等级和挑战值
/// @param ctx - 交易上下文
public entry fun verify_proof(
    verifier: &ZkVerifier,
    circuit_name: String,
    proof: String,
    public_inputs: String,
    required_level: u64,
    ctx: &mut TxContext,
) {
    // 验证密钥是否存在
    assert!(table::contains(&verifier.verification_keys, circuit_name), EVerificationKeyNotFound);
    
    // 此处应该调用原生函数进行实际验证
    // 由于Move不直接支持复杂的零知识证明验证，这里我们简化处理
    // 在实际生产环境中，应该通过Native函数调用或链下服务完成
    
    // 模拟验证成功
    let is_verified = true;  // 在实际环境中，这里应该是验证的结果
    
    // 发出验证结果事件
    event::emit(VerificationResult {
        user: tx_context::sender(ctx),
        circuit_name,
        is_verified,
        required_level,
    });
}

/// 获取验证密钥
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @return 验证密钥JSON字符串
public fun get_verification_key(verifier: &ZkVerifier, circuit_name: &String): String {
    *table::borrow(&verifier.verification_keys, *circuit_name)
} 