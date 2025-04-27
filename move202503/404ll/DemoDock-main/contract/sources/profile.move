module contract::profile {
    
    use std::string::String;
    use sui::event::emit;

const ERROR_PROFILE_EXISTS :u64 = 4;
const ERROR_PROFILE_NOT_EXISTS :u64 = 5;

public struct Profile has key {
    id: UID,
    name: String,
    demos: vector<ID>,
}

public struct State has key {
    id: UID,
    profiles: vector<ID>,
}
    
public struct ProfileCreated has copy,drop{
    id: ID,
    name: String
}

fun init(ctx: &mut TxContext) {
    let state = State {
        id: object::new(ctx),
        profiles: vector::empty(),
    };
    
    transfer::share_object(state)   
}

public fun create_profile( name: String,state:&mut State, ctx: &mut TxContext,) {
    
    let profile = Profile {
        id: object::new(ctx),
        name: name,
        demos: vector::empty(),
    };

    let profile_id = profile.id.to_inner();
    assert!(!vector::contains(&state.profiles, &profile_id), ERROR_PROFILE_EXISTS);
    vector::push_back(&mut state.profiles, profile_id);
    
    emit(ProfileCreated {
        id: profile_id,
        name: profile.name,
    });

    transfer::transfer(profile,ctx.sender());
}

public fun add_demo_to_profile(profile: &mut Profile, demo: ID,) {
    assert!(!vector::contains(&profile.demos, &demo), ERROR_PROFILE_NOT_EXISTS);
    vector::push_back(&mut profile.demos, demo);
}

}