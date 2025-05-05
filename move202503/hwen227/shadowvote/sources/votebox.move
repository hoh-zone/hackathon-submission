module shadowvote::votebox;
use shadowvote::utils::is_prefix;
use sui::clock::{Self,Clock};


public struct EncryptedVoteBox has key{
    id: UID,
    creator : address,
    votes : vector<EncryptedVote>
}

public struct EncryptedVote has store, copy, drop{
    voter : address,
    vote : vector<u8>
}

public(package) fun create_votebox(ctx : &mut TxContext):ID{

    let uid = object::new(ctx);
    let id = object::uid_to_inner(&uid);

    let votebox = EncryptedVoteBox {
        id : uid,
        creator: tx_context::sender(ctx),
        votes : vector::empty()
    };

    transfer::share_object(votebox);
    id
}

public(package) fun create_encrypted_vote(voter: address, vote: vector<u8>):EncryptedVote{
    let vote = EncryptedVote{
        voter,
        vote
    };
    vote
}

public(package) fun add_vote(votebox: &mut EncryptedVoteBox, vote : EncryptedVote ){
    vector::push_back<EncryptedVote>(&mut votebox.votes,vote);
}

public(package) fun has_voted(votebox: &EncryptedVoteBox, voter: address): bool {
    let mut i = 0;
    let len = vector::length(&votebox.votes);

    while (i < len) {
        let vote = vector::borrow(&votebox.votes, i);
        if (vote.voter == voter) {
            return true
        };
        i = i + 1;
    };

    false
}

entry fun seal_approve(id: vector<u8>,votebox : &EncryptedVoteBox,end: u64,clock :&Clock,ctx: &TxContext) {
    assert!(approve_internal(id,tx_context::sender(ctx),votebox,end,clock));
}

fun approve_internal(id: vector<u8>, caller : address,votebox : &EncryptedVoteBox,end: u64,clock : &Clock): bool {

    let namespace = namespace(votebox);
    if (!is_prefix(namespace, id)) {
        return false
    };
    if(clock::timestamp_ms(clock)>= end && has_voted(votebox,caller)){
        return true
    };
    if(caller == votebox.creator){
        return true
    };
    false
}

public(package) fun namespace(votebox : &EncryptedVoteBox): vector<u8> {
    votebox.id.to_bytes()

}
