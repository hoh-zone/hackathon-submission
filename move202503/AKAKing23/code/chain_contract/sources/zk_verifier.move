/**
 * 零知识证明验证器
 * 用于验证用户的能力证明，而不暴露具体信息
 */
module chain_contract::zk_verifier;

use std::string::{Self, String};
use std::vector;
use sui::event;
use sui::object::{Self, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::groth16;

// ===== 错误代码 =====
/// 验证失败错误
const EVerificationFailed: u64 = 1;
/// 非授权操作错误
const ENotAuthorized: u64 = 2;
/// 验证密钥不存在错误
const EVerificationKeyNotFound: u64 = 3;
/// 格式错误
const EInvalidFormat: u64 = 4;

// ===== 类型定义 =====

/// 零知识证明验证器对象，用于存储和管理验证密钥
public struct ZkVerifier has key {
    id: UID,
    /// 管理员地址
    admin: address,
    /// 验证密钥，电路名称 -> 验证密钥字节
    verification_keys: Table<String, vector<u8>>,
    /// 已经准备好的验证密钥
    prepared_vks: Table<String, vector<vector<u8>>>,
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
        prepared_vks: table::new(ctx),
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
        prepared_vks: table::new(ctx),
    };
    
    transfer::share_object(verifier);
}

// ===== 公共函数 =====

/// 添加验证密钥并准备验证密钥
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @param verification_key - 验证密钥字节
/// @param use_bn254 - 使用BN254曲线(true)还是BLS12-381曲线(false)
/// @param ctx - 交易上下文
public entry fun add_verification_key(
    verifier: &mut ZkVerifier,
    circuit_name: String,
    verification_key: vector<u8>,
    use_bn254: bool,
    ctx: &mut TxContext,
) {
    // 验证调用者是管理员
    assert!(tx_context::sender(ctx) == verifier.admin, ENotAuthorized);
    
    // 添加验证密钥
    table::add(&mut verifier.verification_keys, circuit_name, verification_key);
    
    // 准备验证密钥
    let pvk = if (use_bn254) {
        groth16::prepare_verifying_key(&groth16::bn254(), &verification_key)
    } else {
        groth16::prepare_verifying_key(&groth16::bls12381(), &verification_key)
    };
    
    // 保存准备好的验证密钥
    table::add(&mut verifier.prepared_vks, circuit_name, pvk);
    
    // 发出事件
    event::emit(VerificationKeyAdded {
        admin: verifier.admin,
        circuit_name,
    });
}

/// 验证零知识证明
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @param proof - 证明字节
/// @param public_inputs - 公共输入字节
/// @param required_level - 要求等级
/// @param use_bn254 - 使用BN254曲线(true)还是BLS12-381曲线(false)
/// @param ctx - 交易上下文
public entry fun verify_proof(
    verifier: &ZkVerifier,
    circuit_name: String,
    proof: vector<u8>,
    public_inputs: vector<u8>,
    required_level: u64,
    use_bn254: bool,
    ctx: &mut TxContext,
) {
    // 验证密钥是否存在
    assert!(table::contains(&verifier.prepared_vks, circuit_name), EVerificationKeyNotFound);
    
    // 获取准备好的验证密钥
    let pvk = table::borrow(&verifier.prepared_vks, circuit_name);
    
    // 转换证明和公共输入为Groth16格式
    let proof_points = groth16::proof_points_from_bytes(proof);
    let public_inputs_vec = groth16::public_proof_inputs_from_bytes(public_inputs);
    
    // 使用Sui的原生Groth16函数进行验证
    let is_verified = if (use_bn254) {
        groth16::verify_groth16_proof(&groth16::bn254(), pvk, &public_inputs_vec, &proof_points)
    } else {
        groth16::verify_groth16_proof(&groth16::bls12381(), pvk, &public_inputs_vec, &proof_points)
    };
    
    // 确保验证通过
    assert!(is_verified, EVerificationFailed);
    
    // 发出验证结果事件
    event::emit(VerificationResult {
        user: tx_context::sender(ctx),
        circuit_name,
        is_verified,
        required_level,
    });
}

/// 获取原始验证密钥
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @return 验证密钥字节
public fun get_verification_key(verifier: &ZkVerifier, circuit_name: &String): vector<u8> {
    *table::borrow(&verifier.verification_keys, *circuit_name)
}

/// 获取准备好的验证密钥
/// @param verifier - 验证器对象
/// @param circuit_name - 电路名称
/// @return 准备好的验证密钥
public fun get_prepared_verification_key(verifier: &ZkVerifier, circuit_name: &String): vector<vector<u8>> {
    *table::borrow(&verifier.prepared_vks, *circuit_name)
} 