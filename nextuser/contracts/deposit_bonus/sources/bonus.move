#[allow(unused_use)]
module deposit_bonus::bonus;
use sui::clock::{Self,Clock};

public struct BonusRecord has store,copy{
    id : address,
    gain : u64, //抽奖收获
    pay : u64, //抽奖开销
    principal : u64, //本金
}

public struct BonusPeriod has key,store{
    id : UID,
    time_ms : u64,
    epoch : u64,
    seed : u256,
    percent : u32,
    bonus_list : vector<BonusRecord>,
}

public fun get_bonus_list(bp : & BonusPeriod) : &vector<BonusRecord>{
    &bp.bonus_list
}

public fun count(bp : &BonusPeriod) : u64{
    bp.bonus_list.length()
}

public fun create_bonus_record(user :address , 
                            gain : u64, 
                            pay : u64, 
                            principal : u64)
                             : BonusRecord{
    BonusRecord{
        id : user,
        gain,
        pay,
        principal
    }
}

public fun get_user_principal(record : &BonusRecord) :(address,u64){
    (record.id,record.principal)
}



public  fun create_bonus_period(time_ms : u64,
                                seed : u256,
                                percent : u32,
                                ctx : &mut TxContext) :BonusPeriod {
    BonusPeriod{
        id : object::new(ctx),
        time_ms : time_ms,
        epoch : ctx.epoch(),
        seed : seed,
        percent : percent,
        bonus_list : vector[],
    }
}

// entry  fun create_period(clock : &Clock,
//                          seed : u256,
//                          percent : u32,
//                          ctx : &mut TxContext)  {
//     let p = create_bonus_period(clock.timestamp_ms(),seed,percent, ctx);
//     transfer::transfer(p,ctx.sender());
// }

public(package) fun add_record(period : &mut BonusPeriod, 
                          bonus : BonusRecord)
{
    period.bonus_list.push_back(bonus);
}
