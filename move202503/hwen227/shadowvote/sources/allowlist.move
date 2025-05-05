// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Based on the allowlist pattern


module shadowvote::allowlist;
use std::vector;
use std::string::{String};
use shadowvote::utils::is_prefix;

const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;


public struct Allowlist has key {
    id: UID,
    name: String,
    list: vector<address>,
}

public struct Cap has key {
    id: UID,
    allowlist_id: ID,
}

public fun create_allowlist(name : String, ctx: &mut TxContext): Cap {
    let  allowlist = Allowlist {
        id: object::new(ctx),
        name,
        list: vector::singleton(tx_context::sender(ctx))
    };
    let cap = Cap{
        id: object::new(ctx),
        allowlist_id: object::id(&allowlist),
    };
    transfer::share_object(allowlist);
    cap
}

// convenience function to create a allowlist and send it back to sender (simpler ptb for cli)
entry fun create_allowlist_entry(name : String,ctx: &mut TxContext) {
    transfer::transfer(create_allowlist(name,ctx), ctx.sender());
}

public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    assert!(!allowlist.list.contains(&account), EDuplicate);
    allowlist.list.push_back(account);
}

public fun batch_add(allowlist: &mut Allowlist, cap: &Cap, accounts: vector<address>) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    let len = vector::length(&accounts);
    let mut i = 0;
    while (i < len) {
        let account = *(vector::borrow(&accounts, i));
        if (!vector::contains(&allowlist.list, &account)) {
            vector::push_back(&mut allowlist.list, account);
        };
        i = i + 1;
    };
}

public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    allowlist.list = allowlist.list.filter!(|x| x != account);
}

public fun batch_remove(allowlist: &mut Allowlist, cap: &Cap, accounts: vector<address>) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);

    let mut retained = vector::empty<address>();

    // 仅保留不在 accounts 中的地址
    let list_len = vector::length(&allowlist.list);
    let mut i = 0;
    while (i < list_len) {
        let addr = *(vector::borrow(&allowlist.list, i));
        if (!vector::contains(&accounts, &addr)) {
            vector::push_back(&mut retained, addr);
        };
        i = i + 1;
    };

    // 用新列表替换原列表
    allowlist.list = retained;
}


public fun namespace(allowlist: &Allowlist): vector<u8> {
    allowlist.id.to_bytes()
}

fun approve_internal(caller: address, id: vector<u8>, allowlist: &Allowlist): bool {

    // Check if the id has the right prefix
    let namespace = namespace(allowlist);
    if (!is_prefix(namespace, id)) {
        return false
    };

    // Check if user is in the allowlist
    allowlist.list.contains(&caller)
}
entry fun seal_approve(
    id: vector<u8>,
    allowlist: &Allowlist,
    ctx: &TxContext
) {
    assert!(approve_internal(ctx.sender(), id, allowlist), ENoAccess);
}

public(package) fun get_allowlist_id(cap :&Cap):ID{
    cap.allowlist_id
}

public(package) fun get_allowlist_list(allowlist :&Allowlist):vector<address>{
    allowlist.list
}