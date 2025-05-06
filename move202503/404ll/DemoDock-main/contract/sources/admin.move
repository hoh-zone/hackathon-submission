module contract::admin;


use sui::vec_set::VecSet;
use sui::vec_set;

public struct SuperAdminCap has key {
    id: UID,
}

public struct AdminList has key,store {
    id: UID,
    admin: VecSet<address>,
}


fun init(ctx: &mut TxContext) {
    let super_admin = SuperAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(super_admin, ctx.sender());
    let admin_list = AdminList {
        id: object::new(ctx),
        admin: vec_set::empty<address>(),
    };
    transfer::share_object(admin_list);
}

public fun add_admin(
    _super_admin: &SuperAdminCap,
    admin_list: &mut AdminList,
    account: address,
) {
    admin_list.admin.insert(account);
}

public fun remove_admin(
    _super_admin: &SuperAdminCap,
    admin_list: &mut AdminList,
    account: address,
) {
    admin_list.admin.remove(&account);
}
   
public fun check_admin(admin_set:&AdminList, ctx: &TxContext) {
    assert!(admin_set.admin.contains(&ctx.sender()));
}

/// 返回管理员列表中的所有地址
public fun get_admin_addresses(admin_list: &AdminList): vector<address> {
    vec_set::into_keys(admin_list.admin)
}

#[test_only]
public fun init_testing(ctx: &mut TxContext) {
    init(ctx);
}