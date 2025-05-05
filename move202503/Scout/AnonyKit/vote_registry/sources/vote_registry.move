module voting_registry::enclave_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext};

    struct Enclave has key {
        id: UID,
        pcrs: vector<u8>,
        pk: vector<u8>,
    }

    public entry fun register_enclave(pcrs: vector<u8>, pk: vector<u8>, ctx: &mut TxContext) {
        let enclave = Enclave {
            id: object::new(ctx),
            pcrs,
            pk,
        };
        transfer::share_object(enclave);
    }

    public fun get_pk(enclave: &Enclave): vector<u8> {
        enclave.pk
    }
}
