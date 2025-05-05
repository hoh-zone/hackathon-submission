module shadowvote::votepool_wo_al;

use shadowvote::shadowvote::{Self,State};
use shadowvote::votebox::{Self,EncryptedVoteBox};
use std::string::{String};
use sui::event;
use shadowvote::utils::is_prefix;
use sui::clock::{Self,Clock};

const EInvalidVote: u64 = 2;
const EVoteNotStart: u64 = 3;
const EAlreadyFinalized: u64 = 4;
const EDuplicateVote:u64 =5 ;


public struct VotePool_WOAl has key{
    id: UID,
    details : String,
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

public fun create_vote_pool_entry(
    state : &mut State,
    details: String,
    title: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext)
{
    let votepool = create_vote_pool(
        title,
        details,
        start,
        end,
        ctx
    );
    let sender = tx_context::sender(ctx);
    let pool_id = object::id(&votepool);


    if(shadowvote::if_contains_sender(state,sender)){
        shadowvote::add_vote_pool(state,sender,pool_id);
    }else {
        shadowvote::add_new_user_vote_pool(state,sender,pool_id);
    };

    let create_vote_event = VotePoolCreated{
        creator: sender,
        vote_pool: pool_id
    };

    event::emit(create_vote_event);
    transfer::share_object(votepool);
}

public fun create_vote_pool(
    title: String,
    details: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext
):VotePool_WOAl{
    assert!(start < end);


    let votebox_id = votebox::create_votebox(ctx);
    let creator =  tx_context::sender(ctx);
    let votepool = VotePool_WOAl {
        id: object::new(ctx),
        details,
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
    vote_pool: &mut VotePool_WOAl,
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

entry fun seal_approve(id: vector<u8>,votebox :&EncryptedVoteBox,votepool : &VotePool_WOAl,clock :&Clock){
    assert!(approve_internal(id,votebox,votepool.end,clock));
}

fun approve_internal(id: vector<u8>,votebox : &EncryptedVoteBox,end: u64,clock : &Clock): bool {

    let namespace = votebox::namespace(votebox);
    if (!is_prefix(namespace, id)) {
        return false
    };
    if(clock::timestamp_ms(clock)>= end){
        return true
    };
    false
}