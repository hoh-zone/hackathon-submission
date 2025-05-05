module chain_contract::allowlist;

use std::vector;
use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};
use sui::transfer;

// Error codes
const ENotInAllowlist: u64 = 0;
const ENotOwner: u64 = 1;

public struct Allowlist has key, store {
    id: UID,
    addresses: vector<address>,
    owner: address,
}

// 初始化一个新的白名单
public fun initialize(ctx: &mut TxContext): Allowlist {
    Allowlist {
        id: object::new(ctx),
        addresses: vector::empty<address>(),
        owner: tx_context::sender(ctx),
    }
}

// 创建并转移白名单给创建者
public entry fun create_allowlist(ctx: &mut TxContext) {
    let allowlist = initialize(ctx);
    transfer::transfer(allowlist, tx_context::sender(ctx));
}

// 添加用户到白名单
public entry fun add_to_allowlist(allowlist: &mut Allowlist, user: address, ctx: &TxContext) {
    // 检查操作者是否是白名单的拥有者
    assert!(allowlist.owner == tx_context::sender(ctx), ENotOwner);
    
    // 只有当地址不在列表中时才添加
    if (!vector::contains(&allowlist.addresses, &user)) {
        vector::push_back(&mut allowlist.addresses, user);
    }
}

// This function checks if an address is in the allowlist
entry fun seal_approve(id: vector<u8>, allowlist: &Allowlist, user: address) {
    let is_allowed = vector::contains(&allowlist.addresses, &user);
    assert!(is_allowed, ENotInAllowlist);
    // If we get here, access is granted
}
