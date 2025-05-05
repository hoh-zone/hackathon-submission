/// Module: shadowvote
module shadowvote::shadowvote;
use std::string::{String};
use std::vector;
use shadowvote::allowlist::{Allowlist};
use shadowvote::votebox::{Self,EncryptedVoteBox};

use sui::clock::{Self,Clock};
use sui::event;
use sui::table;
use sui::table::Table;


const EInvalidVote: u64 = 2;
const EVoteNotStart: u64 = 3;
const EAlreadyFinalized: u64 = 4;
const EDuplicateVote:u64 =5 ;

public struct State has key{
    id: UID,
    creator_votepool : Table<address,vector<ID>>
}
public struct StateCap has key{
    id :UID,
    state_id : ID
}
public struct VotePool has key{
    id: UID,
    details : vector<u8>,
    allowlist_id: ID,
    title: String,
    creator : address,
    start: u64,
    end: u64,
    votebox_id : ID,
    participantsCount :u64,
}

public struct VotePoolCreated has copy,drop{
    creator : address,
    vote_pool: ID
}

fun init(ctx: &mut TxContext){

    let uid = object::new(ctx);
    let state_id = object::uid_to_inner(&uid);

    let state = State{
        id: uid,
        creator_votepool : table::new<address,vector<ID>>(ctx)
    };

    let cap = StateCap{
        id : object::new(ctx),
        state_id
    };

    transfer::share_object(state);
    transfer::transfer(cap,tx_context::sender(ctx));
}

public fun create_vote_pool_entry(
    state : &mut State,
    details: vector<u8>,
    allowlist: &Allowlist,
    title: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext)
{
    let votepool = create_vote_pool(
        allowlist,
        title,
        details,
        start,
        end,
        ctx
    );
    let sender = tx_context::sender(ctx);
    let pool_id = object::id(&votepool);

   if(table::contains(&state.creator_votepool,sender)){
       let pools = table::borrow_mut<address,vector<ID>>(&mut state.creator_votepool, sender);
       vector::push_back(pools,pool_id);
   }else {
       let pools = vector::singleton(pool_id);
       table::add(&mut state.creator_votepool, sender, pools);
   };

    let create_vote_event = VotePoolCreated{
        creator: sender,
        vote_pool: pool_id
    };

    event::emit(create_vote_event);
    transfer::share_object(votepool);
}

public fun create_vote_pool(
    allowlist: &Allowlist,
    title: String,
    details: vector<u8>,
    start: u64,
    end: u64,
    ctx: &mut TxContext
):VotePool{
    assert!(start < end);

    let votebox_id= votebox::create_votebox(ctx);
    // let votes_uid = object::new(ctx);
    // let votebox_id = object::uid_to_inner(&votes_uid);
    let creator =  tx_context::sender(ctx);
    let votepool = VotePool {
        id: object::new(ctx),
        details,
        allowlist_id: object::id(allowlist),
        title,
        creator,
        start,
        end,
        votebox_id,
        participantsCount: 0
    };

    votepool
}

public fun cast_vote(
    vote_pool: &mut VotePool,
    votebox : &mut EncryptedVoteBox,
    vote: vector<u8>,
    clock : &Clock,
    ctx: &TxContext,
){

    let voter = tx_context::sender(ctx);
    assert!(clock::timestamp_ms(clock)<=vote_pool.end,EAlreadyFinalized);
    assert!(clock::timestamp_ms(clock)>=vote_pool.start,EVoteNotStart);
    assert!(vote_pool.votebox_id==object::id(votebox),EInvalidVote);
    assert!(!votebox::has_voted(votebox,voter),EDuplicateVote);
    let vote = votebox::create_encrypted_vote(voter,vote);
    votebox::add_vote(votebox,vote);
    let count = vote_pool.participantsCount;
    vote_pool.participantsCount = count+ 1;
}

//==============================================================================================
// Helper Functions
//==============================================================================================


public(package) fun get_vote_creator(vote_pool: &VotePool):address{
    vote_pool.creator
}


public(package) fun if_contains_sender(state: &State,sender:address):bool{
    table::contains<address,vector<ID>>(&state.creator_votepool,sender)
}

public(package) fun add_new_user_vote_pool(state: &mut State,sender: address,pool_id : ID){
    let pools = vector::singleton(pool_id);
    table::add(&mut state.creator_votepool, sender, pools);
}

public(package) fun add_vote_pool(state: &mut State,sender: address,pool_id : ID){
    let map = table::borrow_mut<address,vector<ID>>(&mut state.creator_votepool,sender);
    vector::push_back(map,pool_id);
}
