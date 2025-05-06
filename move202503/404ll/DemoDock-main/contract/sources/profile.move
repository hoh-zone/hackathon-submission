module contract::profile;

use std::option;
use std::string::String;
use sui::event::emit;
use sui::table::{Self, Table};

const ERROR_PROFILE_EXISTS: u64 = 4;
const ERROR_PROFILE_NOT_EXISTS: u64 = 5;

public struct Profile has key {
    id: UID,
    name: String,
    demos: vector<ID>,
}

public struct State has key {
    id: UID,
    profiles: Table<address, ID>,
}

public struct ProfileCreated has copy, drop {
    owner: address,
    id: ID
}
// public struct ProfileCreated has copy, drop {    
//     id: ID,
//     name: string,
// }

fun init(ctx: &mut TxContext) {
    let state = State {
        id: object::new(ctx),
        profiles: table::new(ctx),
    };

    transfer::share_object(state)
}

public fun create_profile(name: String, state: &mut State, ctx: &mut TxContext) {
    let profile = Profile {
        id: object::new(ctx),
        name: name,
        demos: vector::empty(),
    };

    let profile_id = profile.id.to_inner();
    let owner = ctx.sender();
    assert!(!table::contains(&state.profiles, owner), ERROR_PROFILE_EXISTS);
    table::add(&mut state.profiles, owner, profile_id);

    emit(ProfileCreated {
        owner: owner,
        id: profile_id
    });

    transfer::transfer(profile, ctx.sender());
}

public fun add_demo_to_profile(profile: &mut Profile, demo: ID, _ctx: &mut TxContext) {
    assert!(!vector::contains(&profile.demos, &demo), ERROR_PROFILE_NOT_EXISTS);
    vector::push_back(&mut profile.demos, demo);
}

public fun get_profile_by_addresss(state: &State, ctx: &TxContext): Option<ID> {
    let address = ctx.sender();
    if (table::contains(&state.profiles, address)) {
        let profile_id = table::borrow(&state.profiles, address);
        option::some(*profile_id)
    } else {
        option::none()
    }
}

//helper fun
#[test_only]
public fun init_testing(ctx: &mut TxContext) {
    init(ctx);
}
