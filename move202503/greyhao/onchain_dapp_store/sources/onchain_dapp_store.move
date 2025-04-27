/// Module: onchain_dapp_store
module onchain_dapp_store::onchain_dapp_store;

use std::string::String;
use sui::event;

// ================
// Error codes
// ================
const EADMINHASEXIT: u64 = 10001;
const EADMINNOTEXIT: u64 = 10002;
const ENOTADMIN: u64 = 10003;
const EAPPROVED: u64 = 10004;
const EDAPPNOTEXIT: u64 = 10012;

// ================
// Structs
// ================
public struct SuperAdminCap has key {
    id: UID,
}

public struct StoreInfo has key, store {
    id: UID,
    admins: vector<address>,
    dApps: vector<address>,
}

public struct DAppInfo has key, store {
    id: UID,
    name: String,
    icon: String,
    url: String,
    desc: String,
    submit_address: address,
    submit_timestamp: u64,
    approve_admins: vector<address>,
    reject_admins: vector<address>,
}

// ================
// Event Structs
// ================
public struct SubmitDAppEvent has copy, drop {
    dapp_id: ID,
}

public struct AddAdminEvent has copy, drop {
    add_address: address,
}

public struct RemoveAdminEvent has copy, drop {
    remove_address: address,
}

// ================
// Init
// ================
fun init(ctx: &mut TxContext) {
    // super admin cap
    let super_admin_cap = SuperAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(super_admin_cap, ctx.sender());

    // init list
    let store_info = StoreInfo {
        id: object::new(ctx),
        admins: vector::empty(),
        dApps: vector::empty(),
    };
    transfer::share_object(store_info);
}

// ================
// Entry functions
// ================
public entry fun submit_dApp(
    dapp_name: String,
    dapp_icon: String,
    dapp_url: String,
    dapp_desc: String,
    submit_timestamp: u64,
    store_info: &mut StoreInfo,
    ctx: &mut TxContext,
) {
    let submit_address = ctx.sender();
    let mut approve_admins: vector<address> = vector::empty();
    let reject_admins: vector<address> = vector::empty();
    // if is admin submit, add admin to approve_admins
    if (store_info.admins.contains(&submit_address)) {
        approve_admins.push_back(submit_address);
    };
    let uid = object::new(ctx);
    let id = object::uid_to_inner(&uid);
    let dappInfo = DAppInfo {
        id: uid,
        name: dapp_name,
        icon: dapp_icon,
        url: dapp_url,
        desc: dapp_desc,
        submit_address: submit_address,
        submit_timestamp: submit_timestamp,
        approve_admins: approve_admins,
        reject_admins: reject_admins,
    };
    transfer::share_object(dappInfo);
    store_info.dApps.push_back(object::id_to_address(&id));
    event::emit(SubmitDAppEvent {
        dapp_id: id,
    });
}

public entry fun admin_verify_dapp(
    verify_state: bool,
    store_info: &mut StoreInfo,
    dappInfo: &mut DAppInfo,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    // check is admin
    assert!(store_info.admins.contains(&sender), ENOTADMIN);
    // check is admin approve dapp
    assert!(!dappInfo.approve_admins.contains(&sender), EAPPROVED);
    // check is dapp in store
    assert!(
        store_info.dApps.contains(&object::id_to_address(&dappInfo.id.to_inner())),
        EDAPPNOTEXIT,
    );
    // add admins
    if (verify_state) {
        dappInfo.approve_admins.push_back(sender);
    } else {
        dappInfo.reject_admins.push_back(sender);
    }
}

public entry fun add_admin(
    _: &SuperAdminCap,
    store_info: &mut StoreInfo,
    new_admin: address,
    _: &mut TxContext,
) {
    assert!(!store_info.admins.contains(&new_admin), EADMINHASEXIT);
    store_info.admins.push_back(new_admin);
    event::emit(AddAdminEvent { add_address: new_admin });
}

public entry fun remove_admin(
    _: &SuperAdminCap,
    store_info: &mut StoreInfo,
    remove_admin: address,
    _: &mut TxContext,
) {
    let (contains, index) = store_info.admins.index_of(&remove_admin);
    assert!(contains, EADMINNOTEXIT);
    store_info.admins.remove(index);
    event::emit(RemoveAdminEvent { remove_address: remove_admin });
}
