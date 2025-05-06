// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module contract::demo;

use contract::admin::{AdminList, get_admin_addresses};
use contract::profile::{Profile, add_demo_to_profile};
use contract::utils::is_prefix;
use std::string::String;
use sui::dynamic_field as df;
use sui::event::emit;
use sui::table::{Self, Table};

//=====Error Codes=====
const EInvalidCap: u64 = 0;
const EDuplicate: u64 = 2;
const MARKER: u64 = 3;
const ERROR_PROFILE_EXISTS: u64 = 4;
const EDEMO_NOT_EXISTS: u64 = 5;

//=====Structs=====
public struct Demo has key {
    id: UID,
    name: String,
    des: String,
    visitor_list: vector<address>,
}

public struct Cap has key {
    id: UID,
    demo_id: ID,
}

public struct DemoPool has key {
    id: UID,
    demos: Table<ID, address>,
}

//=====Events=====
public struct DemoCreated has copy, drop {
    id: ID,
    owner: address,
}

public struct DemoRequest has copy, drop {
    des: String,
    demo_id: ID,
    visitor: address,
}

//=====Functions=====
fun init(ctx: &mut TxContext) {
    let pool = DemoPool {
        id: object::new(ctx),
        demos: table::new(ctx),
    };
    transfer::share_object(pool);
}

public fun create_demo(
    name: String,
    des: String,
    pool: &mut DemoPool,
    profile: &mut Profile,
    ctx: &mut TxContext,
): Cap {
    let owner = ctx.sender();
    let demo = Demo {
        id: object::new(ctx),
        visitor_list: vector::empty(),
        name: name,
        des: des,
    };

    let cap = Cap {
        id: object::new(ctx),
        demo_id: object::id(&demo),
    };

    let demo_id = demo.id.to_inner();
    add_demo_to_profile(profile, cap.demo_id, ctx);
    assert!(!table::contains(&pool.demos, demo_id), ERROR_PROFILE_EXISTS);
    table::add(&mut pool.demos, demo_id, owner);

    emit(DemoCreated {
        id: demo.id.to_inner(),
        owner: owner,
    });

    transfer::share_object(demo);
    cap
}

entry fun create_demo_entry(
    name: String,
    des: String,
    pool: &mut DemoPool,
    profile: &mut Profile,
    ctx: &mut TxContext,
) {
    transfer::transfer(create_demo(name, des, pool, profile, ctx), ctx.sender());
}

public fun add_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
    assert!(cap.demo_id == object::id(demo), EInvalidCap);
    assert!(!demo.visitor_list.contains(&account), EDuplicate);
    demo.visitor_list.push_back(account);
}

public fun remove_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
    assert!(cap.demo_id == object::id(demo), EInvalidCap);
    demo.visitor_list = demo.visitor_list.filter!(|x| x != account);
}

public fun request_demo(demo: &mut Demo, des: String, ctx: &mut TxContext) {
    let visitor = ctx.sender();
    assert!(!demo.visitor_list.contains(&visitor), ERROR_PROFILE_EXISTS);
    emit(DemoRequest {
        des: des,
        demo_id: demo.id.to_inner(),
        visitor: visitor,
    });
}

public fun namespace(demo: &Demo): vector<u8> {
    demo.id.to_bytes()
}

public fun approve_internal(
    caller: address,
    demo: &Demo,
    id: vector<u8>,
    adminlist: &AdminList,
): bool {
    let namespace = namespace(demo);
    if (!is_prefix(namespace, id)) {
        return false
    };
    let admin_list = get_admin_addresses(adminlist);
    if (admin_list.contains(&caller)) {
        return true
    } else {
        demo.visitor_list.contains(&caller)
    }
}

public fun publish(demo: &mut Demo, cap: &Cap, blob_id: String) {
    assert!(cap.demo_id == object::id(demo), EInvalidCap);
    df::add(&mut demo.id, blob_id, MARKER);
}

//=====getter=====
public fun get_demo_owner(demo_id: ID, pool: &DemoPool): address {
    assert!(table::contains(&pool.demos, demo_id), EDEMO_NOT_EXISTS);
    let address = table::borrow(&pool.demos, demo_id);
    *address
}

#[test_only]
public fun init_testing(ctx: &mut TxContext) {
    init(ctx);
}
