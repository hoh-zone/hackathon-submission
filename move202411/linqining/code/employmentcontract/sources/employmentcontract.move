module employmentcontract::offer;

use std::string::{String};
use sui::event;
use sui::clock::Clock;

public struct Offer has key,store{
    id: UID,
    desc: String,
    publisher: address,
    deadline_ms: u64, //offer截止时间
}

public struct Contract has key,store{
    id: UID,
    employee: address,
    employer: address,
    offer_id: address,
}

public struct ContractEvent has copy,drop {
    desc:String,
    employer:address,
    employee:address,
}


fun init(_ctx:&mut TxContext){

}

public entry fun offer(applicant:address, blob_id :String,deadline_ms:u64,  ctx:&mut TxContext){
    let offer = Offer{
        id: object::new(ctx),
        desc:blob_id,
        deadline_ms:deadline_ms,
        publisher:ctx.sender(),
    };
    transfer::transfer(offer,applicant);
}

// sign offer
public entry fun sign_offer(clock: &Clock,offer:&Offer, ctx:&mut TxContext){
    let current_ms = clock.timestamp_ms();
    assert!(offer.deadline_ms>current_ms,0x1);  // 超过期限
    let contract_employee = Contract{
        id: object::new(ctx),
        employee: ctx.sender(),
        employer:offer.publisher,
        offer_id:object::uid_to_address(&offer.id),
    };
    let contract_employer = Contract{
        id: object::new(ctx),
        employee: ctx.sender(),
        employer:offer.publisher,
        offer_id:object::uid_to_address(&offer.id),
    };
    transfer::transfer(contract_employee,ctx.sender());
    transfer::transfer(contract_employer,offer.publisher);
    event::emit(ContractEvent {
        employee: ctx.sender(),
        employer: offer.publisher,
        desc: offer.desc,
    });
}


