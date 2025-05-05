module voting_dapp::voting {
    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext};
    use sui::table::{Self, Table};
    use sui::ed25519;
    use voting_registry::enclave_registry::{Enclave, get_pk};

    struct Voting has key {
        id: UID,
        votes: Table<String, u64>,
    }

    public entry fun init_voting(ctx: &mut TxContext) {
        let voting = Voting {
            id: object::new(ctx),
            votes: table::new(ctx),
        };
        table::add(&mut voting.votes, "A".to_string(), 0);
        table::add(&mut voting.votes, "B".to_string(), 0);
        transfer::share_object(voting);
    }

    public entry fun submit_vote(voting: &mut Voting, enclave: &Enclave, vote: String, signature: vector<u8>, timestamp_ms: u64) {
        let message = bcs::to_bytes(&vote) + bcs::to_bytes(×tamp_ms);
        let enclave_pk = get_pk(enclave);
        assert!(ed25519::ed25519_verify(&signature, &enclave_pk, &message), 1000);
        let count = table::borrow_mut(&mut voting.votes, vote);
        *count = *count + 1;
    }

    public fun get_votes(voting: &Voting, option: String): u64 {
        *table::borrow(&voting.votes, option)
    }
}

