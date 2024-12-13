module employmentcontract::offer;

use std::string::{String};
use qualification::cfa::{CFACertificate};
use sui::event;

public struct Offer has key,store{
    id: UID,
    applicant: address,
    desc: String,
    publisher: address
}

public struct Contract has key,store{
    id: UID,
    desc: String,
    applicant: address,
}

public struct ContractEvent has copy,drop {
    desc:String,
    employer:address,
    employee:address,
}


fun init(_ctx:&mut TxContext){

}

public entry fun offer(applicant:address, blob_id :String, ctx:&mut TxContext){
    let offer = Offer{
        id: object::new(ctx),
        applicant:applicant,
        desc:blob_id,
        publisher:ctx.sender(),
    };
    transfer::transfer(offer,applicant);
}

// sign offer
public entry fun sign_offer(offer:&Offer,_:&CFACertificate,  ctx:&mut TxContext){
    let contract_employee = Contract{
        id: object::new(ctx),
        desc: offer.desc,
        applicant: ctx.sender()
    };
    let contract_employer = Contract{
        id: object::new(ctx),
        desc: offer.desc,
        applicant: ctx.sender()
    };
    transfer::transfer(contract_employee,ctx.sender());
    transfer::transfer(contract_employer,offer.publisher);
    event::emit(ContractEvent {
        employee: ctx.sender(),
        employer: offer.publisher,
        desc: offer.desc,
    });
}


