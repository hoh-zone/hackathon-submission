module game_park::user_info;

use std::string::String;
use sui::package::Publisher;
use sui::table::{Self, Table};

// error code
const E_Not_Equal_Pwd: u64 = 3;

public struct UserTable has key {
    id: UID,
    addr_name: Table<address, String>,
    name_pwd: Table<String, String>
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(UserTable {
        id: object::new(ctx),
        addr_name: table::new<address, String>(ctx),
        name_pwd: table::new<String, String>(ctx)
    });
}

entry fun bind(_: &Publisher, user_table: &mut UserTable, addr: address, name: String, pwd: String) {
    user_table.addr_name.add(addr, name);
    user_table.name_pwd.add(name, pwd);
}

entry fun rebind(_: &Publisher, user_table: &mut UserTable, addr: address, name: String, pwd: String, new_pwd: String) {
    let stored_name = &mut user_table.addr_name[addr];
    let stored_pwd = &mut user_table.name_pwd[*stored_name];
    assert!(stored_pwd == pwd, E_Not_Equal_Pwd);
    if (stored_name == name) {
        *stored_pwd = new_pwd;
    } else {
        user_table.name_pwd.remove(*stored_name);
        *stored_name = name;
        user_table.name_pwd.add(name, new_pwd);
    };
}