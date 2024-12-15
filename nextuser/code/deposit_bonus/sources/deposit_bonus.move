#[allow(unused_variable,unused_use)]
module deposit_bonus::deposit_bonus;
use std::hash;
use std::u256;
use sui::random::Random;
use sui::bcs;
use sui::address;
use sui::balance::{Self,Balance};
use sui::coin::{Self,Coin};
use sui::table::{Self,Table};
use sui::clock::{Self,Clock};
use sui::event::emit;
use sui::sui::SUI  ;
use deposit_bonus::err_consts;
use sui_system::staking_pool::{StakedSui, Self};
use sui_system::sui_system::{Self,SuiSystemState,request_withdraw_stake_non_entry,request_add_stake_non_entry};
use deposit_bonus::range::Range;
use deposit_bonus::bonus::{Self,BonusPeriod,BonusRecord};
use sui::linked_table::{Self,LinkedTable};
use std::debug::print;
use deposit_bonus::utils::log;
use deposit_bonus::user_list::{Self,UserList};
const PERCENT_MAX:u32 = 10000; //100%
const FeeLimit : u32 = 1000; // 10%
const BonusLimit : u32 = 10000; // 100%  
public struct AdminCap has key { id : UID}
public struct OperatorCap has key{
    id : UID,
    operators : vector<address>    
}

public struct DepositEvent has copy,drop{
    user : address,
    share_amount : u64,
    amount : u64,
    update_time_ms : u64,
}

public struct UserShare  has store{
    id : address,
    original_money : u64,//
    share_amount : u64,//share 份额
    update_time_ms: u64,
    bonus : u64,
}

public(package) fun time_ms(share : &UserShare) : u64{
    share.update_time_ms
}

public(package) fun  user_original_money(us : &UserShare) : u64{
    us.original_money
}

public (package) fun get_seed(storage : &Storage) : u256{
    storage.seed
}

public (package) fun fee(storage : &Storage) : u64{
    storage.fee_balance.value()
}

public (package) fun bonus(storage : &Storage) : u64{
    storage.bonus_balance.value()
}


public(package) fun  user_share_amount(us : &UserShare) : u64{
    us.share_amount
}

public(package) fun  user_share_bonus(us : &UserShare) : u64{
    us.bonus
}

#[allow(unused_function)]
fun destroy_user_share(share : UserShare){
    let UserShare{id:_,original_money:_,share_amount :_,update_time_ms :_, bonus : _} = share;
}

public struct Share has copy,drop{
    id : address,
    amount : u64,
}

public struct AllocateEvent has copy,drop{
    users : vector<Share>,
    total_amount : u64,
}

public struct Storage has key,store{
    id : UID,
    user_shares : UserList<UserShare>,
    total_shares : u64,
    total_staked : u64,
    staked_suis : vector<StakedSui>,
    left_balance : Balance<SUI>,
    bonus_balance : Balance<SUI>,
    bonus_donated : Balance<SUI>,
    fee_balance : Balance<SUI>,
    bonus_percent : u32,
    fee_percent : u32,
    seed : u256,
}

public fun total_share_amount(storage : &Storage) : u64{
    storage.total_shares
}

public fun total_staked_amount(storage : &Storage) : u64{
    storage.total_staked
}

public struct BonusHistory has key{
    id : UID,
    // history : LinkedTable<u64,BonusPeriod>,//key  time_ms/(1 day ms)
    // times : vector<u64>,
    periods : vector<address>
    //user address => bonus record addr
    //user_recent_bonus : Table<address, address>,
}

public fun get_recent_period(bh : &BonusHistory) : address {
    let len = bh.periods.length();
    assert!(len > 0);
    * bh.periods.borrow(len -1 )
}

public struct UserInfo has copy,drop{
    id : address,
    orignal_amount : u64,
    reward : u64,
    bonus  : u64,
}

public fun user_id(info : &UserInfo) : address{
    info.id
}

public fun user_bonus(info :&UserInfo) : u64 {
    info.bonus
}

public fun user_reward(info :&UserInfo) : u64 {
    info.reward
}
public fun user_orignal_amount(info :&UserInfo) : u64 {
    info.orignal_amount
}

//todo ,no use in v1.0
public struct Card has key,store{
    id : UID,
}

fun add_staked_sui(storage : &mut Storage , new_staked : StakedSui){
    let len = storage.staked_suis.length();
    let mut i = 0;
    let new_epoch = staking_pool::stake_activation_epoch(&new_staked);
    while( i < len){
        let s = vector::borrow_mut(&mut storage.staked_suis,i);
        let epoch = staking_pool::stake_activation_epoch(s);
        if(epoch == new_epoch){
            staking_pool::join_staked_sui(s,new_staked);
            return
        };
        i = i + 1;
    };
    vector::push_back(&mut storage.staked_suis, new_staked);
}

fun new_storage(ctx : &mut TxContext) : Storage{
    let id = object::new(ctx);
    let seed = id.to_address().to_u256();
    Storage{
        id : id,
        user_shares :user_list::new<UserShare>(ctx),
        total_shares : 0,
        total_staked : 0,
        staked_suis : vector[],
        left_balance : balance::zero<SUI>(),
        bonus_balance :  balance::zero<SUI>(),
        bonus_donated : balance::zero<SUI>(),
        fee_balance : balance::zero<SUI>(),
        bonus_percent : 5000 ,//50%
        fee_percent : 1000, //base point , 5%
        seed : seed,
        
    }
}
fun init(ctx : &mut TxContext){
    let storage =  new_storage(ctx);

    transfer::share_object(storage);

    let admin_cap = AdminCap{ id : object::new(ctx)};

    transfer::transfer(admin_cap,ctx.sender());

    let mut operator_cap = OperatorCap{id : object::new(ctx), operators : vector[]};
    operator_cap.operators.push_back(ctx.sender());

    transfer::share_object(operator_cap);

    let h = BonusHistory{
        id : object::new(ctx),
        // history : linked_table::new<u64,BonusPeriod>(ctx),
        periods : vector[],
       
    };
    transfer::share_object(h);
}

fun money_to_share(storage :& Storage, money : u64) : u64{
    
    let total_sui = storage.total_staked as u128;
    assert!(total_sui != 0);
    let total_share = (storage.total_shares as u128);
    if(total_share == 0) {
        return money
    };
    let share_amount = (total_share * (money as u128)  / total_sui) as u64;
    share_amount
}

fun share_to_money(storage : & Storage , share : u64) : u64{
    let total_sui = storage.total_staked as u128;
    let total_shares = storage.total_shares as u128;
    (total_sui * (share as u128) / total_shares) as u64
}

fun add_user_share(storage :&mut Storage, original_money :u64,share_amount:u64,time_ms : u64,sender : address){
    let user_shares = &mut storage.user_shares;
    if(user_shares.contains(sender)){
        let user_share = user_shares.borrow_mut(sender);
        user_share.share_amount = user_share.share_amount + share_amount;
        user_share.original_money = user_share.original_money + original_money;
        user_share.update_time_ms = time_ms;
    }
    else{
        let user_share =   UserShare{
            id :sender,
            original_money : original_money,
            share_amount : share_amount,            
            update_time_ms : time_ms,
            bonus : 0
        };
        storage.user_shares.add(sender, user_share);
    };

}

fun update_share_after_stake(storage :&mut Storage , original_money : u64,time_ms:u64, sender : address) : u64{
    let old_money = storage.total_staked as u128;
    let old_share = storage.total_shares as u128;


    if(old_money == 0){
        storage.total_staked = original_money;
        storage.total_shares = original_money;
        add_user_share(storage,original_money,original_money,time_ms,sender);
        return original_money
    };

    // new_share / new_money  == old_share / old_money 
    let share_amount = money_to_share(storage, original_money);
    storage.total_staked = storage.total_staked + original_money;
    storage.total_shares = storage.total_shares + share_amount;
    add_user_share(storage,original_money,share_amount,time_ms,sender);
    share_amount
}

entry fun deposit(clock: &Clock,storage: & mut Storage,
                  system_state: &mut SuiSystemState,validator_address: address,
                  coin: Coin<SUI>, ctx: &mut TxContext) {
    
    let sender = ctx.sender();
    let update_time_ms = clock::timestamp_ms(clock);
    let value = coin::value(&coin);
    deposit_to_stake(storage, system_state, coin, validator_address,ctx);
    let share = update_share_after_stake(storage, value, update_time_ms, sender);

    emit(DepositEvent{
        user : sender,
        share_amount : share,
        amount : value,
        update_time_ms : update_time_ms,        
    });
}

fun reduce_share_after_withdraw(storage : &mut Storage,time_ms : u64, withdraw_stake : u64,withdraw_share : u64, sender : address)
{
    let user_share = storage.user_shares.borrow_mut(sender);  
    assert!(user_share.share_amount >= withdraw_share,err_consts::withdraw_share_not_enough!());
    
    user_share.share_amount = user_share.share_amount - withdraw_share;
    user_share.original_money = user_share.original_money - withdraw_stake;
    user_share.update_time_ms = time_ms;
    storage.total_shares = storage.total_shares - withdraw_share;
    //do not remove ,because keys and values ,count in user_list is related.
    // if(user_share.share_amount == 0){
    //     let s = table::remove(&mut storage.user_shares.values,sender);
    //     destroy_user_share(s);
    // };
}

/**
one user  to withdraw his staked sui
1  take bonus first ,if meet the amount ,return
2  take the staked sui to meet amount
*/
public  fun withdraw(clock: &Clock,storage: & mut Storage,system_state: &mut SuiSystemState,
                    amount : u64,ctx : &mut TxContext) : Balance<SUI>{
    let sender = ctx.sender();
    assert!( storage.user_shares.contains(sender),err_consts::account_not_exists!() );
    

    let user_share = storage.user_shares.borrow(sender);
    let bonus_amount = user_share.bonus;
    let share_amount = user_share.share_amount ;
    if(bonus_amount >= amount){
        let bonus = withdraw_bonus(storage, amount,ctx);
        assert!(bonus.value() >= amount);
        return bonus
    };
    
    let bonus = withdraw_bonus(storage, bonus_amount, ctx);
    let need = amount - bonus.value();    

    let user_money = share_to_money(storage, share_amount);
    //calcualte share before withdraw stake ( total_staked will change when)
    let withdraw_share = money_to_share(storage, need);
    assert!(user_money  >= need ,err_consts::share_not_enough!() );
    let mut balance = withdraw_from_stake(storage, system_state, need, ctx);
    let withdraw_stake = balance.value();
    balance.join(bonus);
    
    reduce_share_after_withdraw(storage,clock.timestamp_ms(),withdraw_stake, withdraw_share,sender);
    balance
}

fun deposit_to_stake(storage :&mut Storage,
        system_state: &mut SuiSystemState,
        coin: Coin<SUI>,
        validator_address: address,
        ctx : &mut TxContext)
{
    let coin_value = coin.value();
    let s = request_add_stake_non_entry(system_state,coin,
                                                    validator_address,ctx);
    assert!(s.amount() == coin_value);
    add_staked_sui(storage, s) ;   
}

/**
before to call this function,  call withdraw_all_from_stake at first ,
*/
fun stake_left_balance(storage :&mut Storage,
        system_state: &mut SuiSystemState,
        validator_address: address,
        ctx : &mut TxContext)
{
    let amount = balance::value(&storage.left_balance);
    let balance = balance::split(&mut storage.left_balance, amount );
    let coin = coin::from_balance(balance, ctx);
    let s = request_add_stake_non_entry(system_state,coin,
                                                    validator_address,ctx);
    
    storage.total_staked =  staking_pool::staked_sui_amount(&s);   
    //old staked_sui should be withdrawed
    assert!(vector::is_empty(&storage.staked_suis));
    storage.staked_suis.push_back(s);
}

fun save_to_left_balance(storage :&mut Storage, balance : Balance<SUI> ){
    if(balance.value() == 0){
        balance::destroy_zero(balance);
        return
    };
    balance::join(&mut storage.left_balance,balance);
}

fun split_exact_balance(storage :&mut Storage, mut merge_balance :Balance<SUI>,amount : u64) : Balance<SUI>
{
    if(amount == merge_balance.value()){
        return merge_balance
    };

    let ret = merge_balance.split(amount);
    save_to_left_balance(storage, merge_balance);
    ret
}

// t : time in second
// entry fun get_bonus_records(bh :&BonusHistory,t : u64) : vector<BonusRecord>{
//     let node : &BonusPeriod = bh.history.borrow(t);
//     node.get_bonus_list()
// }


/**
when one user withdraw his share
*/
fun withdraw_from_stake(storage :&mut Storage, 
                        system_state: &mut SuiSystemState,
                        amount : u64,
                        ctx: &mut TxContext) :Balance<SUI>{

    let count = vector::length(&storage.staked_suis);
    let mut merge_balance = balance::zero<SUI>();
    while(!vector::is_empty(&storage.staked_suis)){
        let mut staked_sui  =  storage.staked_suis.pop_back();

        let need = amount - merge_balance.value();
        let curr_amount = staking_pool::staked_sui_amount(&staked_sui) ;
        if( curr_amount >= need  ){
            let split = staked_sui.split(need, ctx);
            let balance = request_withdraw_stake_non_entry(system_state,split,ctx);
            assert!(balance.value() >= need, err_consts::balance_less_than_staked!());
            merge_balance.join(balance);
            storage.staked_suis.push_back(staked_sui);
            storage.total_staked = storage.total_staked - need;
            assert!(merge_balance.value() >=  amount);
            
        }
        else{
              let balance = request_withdraw_stake_non_entry(system_state,staked_sui,ctx); 
              merge_balance.join(balance);
              storage.total_staked = storage.total_staked - curr_amount;
        };
        if(merge_balance.value() >= amount){
            return split_exact_balance(storage,merge_balance , amount)
        }

    };
    assert!(merge_balance.value() >= amount, err_consts::withdraw_fail!());
    split_exact_balance(storage,merge_balance , amount)
}

/**
take the reward  after a period
*/
fun withdraw_all_from_stake(storage :&mut Storage, 
                        system_state: &mut SuiSystemState,
                        ctx: &mut TxContext) :(u64,u64) {

    let count = vector::length(&storage.staked_suis);
    let mut merge_balance = balance::zero<SUI>();
    while(!vector::is_empty<StakedSui>(&storage.staked_suis)){
        let staked_sui  = vector::pop_back(&mut storage.staked_suis);
        let b = request_withdraw_stake_non_entry(system_state,staked_sui,ctx); 
        merge_balance.join(b);
    };
    storage.left_balance.join(merge_balance);
    let old = storage.total_staked;
    let new = storage.left_balance.value();
    storage.total_staked = 0;
    (old,new)
    
}

public(package) fun allocate_bonus(storage : &mut Storage,
                    balance_amount : u64, 
                    shares : &LinkedTable<address,u256>,
                    time_ms : u64,
                    bonus_history :&mut BonusHistory,
                    ctx :&mut TxContext) : u64{
    let mut total = 0;
    

    let mut allocate_event = AllocateEvent {
           users : vector[],
           total_amount : balance_amount, 
    };
    let mut node = shares.front();
    while(! option::is_none(node)){
        let addr = * node.borrow();
        let amount = shares.borrow(addr);
        total = total + *amount;
        //log(b"user:",&addr);
        //log(b"overlapped:",amount);
        node = shares.next(addr);
    };
    //log(b"total hit:", &total);
    //log(b"total balance" , &balance_amount);

    let mut bonus_period :BonusPeriod = bonus::create_bonus_period(time_ms,storage.seed,
                                                                    storage.bonus_percent,ctx);

    node = linked_table::front(shares);
    while(!option::is_none(node)){
        let addr = * node.borrow();
        let amount = * shares.borrow(addr);

        let gain = (balance_amount as u256) * amount / total;
        //let gain_balance : Balance<SUI> = balance::split<SUI>(&mut bonus, gain as u64);
        //let coin = coin::from_balance(gain_balance, ctx);
        
        let user_share =   storage.user_shares.borrow_mut(addr);
        let pay = (user_share.share_amount as u128)* (balance_amount as u128)/ (storage.total_shares as u128);
        let record = bonus::create_bonus_record(addr ,  gain as u64,
                                                        pay as u64, user_share.original_money) ;
        bonus_period.add_record( record);
        user_share.bonus = user_share.bonus + ( gain as u64);
        user_share.update_time_ms = time_ms;
        vector::push_back(&mut allocate_event.users, Share{
            id : addr,
            amount :  user_share.bonus
        });
        
        node = linked_table::next(shares,addr);
    };
    let count = bonus_period.count();
    bonus_history.periods.push_back(object::id(&bonus_period).to_address());
    transfer::public_freeze_object(bonus_period);
    sui::event::emit(allocate_event);
    count
}

fun get_percent_value( amount : u64, percent : u32) : u64 {
    let percent = percent as u128;
    let amount = amount as u128;
    let max = PERCENT_MAX as u128;
    ((amount * percent)/max) as u64
}
fun alloc_rewards(storage :&mut Storage,
                random : &Random,
                total_rewards : u64,
                time_ms : u64,
                bonus_history :&mut BonusHistory,
                ctx: &mut TxContext) : u64{

    //let percent = storage.bonus_percent as u128;
    let  bonus_amount = get_percent_value(total_rewards, storage.bonus_percent);
    // ((total_rewards as u128) * percent / (PERCENT_MAX as u128)) as u64;
    let mut bonus = balance::split(&mut storage.left_balance, bonus_amount);
    let donated_amount = storage.bonus_donated.value();
    bonus.join(storage.bonus_donated.split(donated_amount));
    let mut total_bonus  = bonus_amount + donated_amount;

    let fee_amount = get_percent_value(total_bonus, storage.fee_percent);
    storage.fee_balance.join( bonus.split(fee_amount));
    total_bonus = total_bonus - fee_amount;

    storage.bonus_balance.join(bonus);    
    log(b"--------total bonus------- ",&total_bonus);

    let shares =  get_hit_users(storage,random,time_ms, ctx);
    let count = allocate_bonus(storage,total_bonus,&shares,time_ms,bonus_history,ctx);
    linked_table::drop(shares);
    count
}

/**
dapp call this function periodically ,
the OperatorCap owner key will be deplayed in server
*/
public(package) entry fun withdraw_and_allocate_bonus(op : &OperatorCap,
                                    clock : &Clock,
                                    storage :&mut Storage,
                                    system_state : &mut SuiSystemState,
                                    random : &Random,
                                    validator_address:address ,  
                                    bonus_history :&mut BonusHistory,
                                    ctx : &mut TxContext) : u64{
    assert!(op.operators.contains(&ctx.sender()),err_consts::not_operator!());
    let time_ms = clock::timestamp_ms(clock);
    let (old,new ) = withdraw_all_from_stake(storage, system_state, ctx);
    assert!(old <= new);
    log(b"old",&old);
    log(b"new",&new);
    
    let total_rewards = new - old;
    let count = alloc_rewards(storage, random,total_rewards,time_ms,bonus_history, ctx);
    stake_left_balance(storage, system_state,  validator_address, ctx);
    count
}

public(package) fun create_random_point(storage : &mut Storage,random :&Random ,time_ms : u64, ctx : &mut TxContext) : u256{
    let mut g = random.new_generator(ctx);
    let mut full_proof: vector<u8> = vector::empty<u8>();
    full_proof.append( bcs::to_bytes(&storage.seed));
    full_proof.append(bcs::to_bytes(&time_ms));
    full_proof.append(bcs::to_bytes(&storage.left_balance.value()));
    let chall_bytes =  bcs::to_bytes(&g.generate_u256());
    let hash: vector<u8> = hash::sha3_256(full_proof);
    assert!(hash.length() == 32);
    let seed  = address::from_bytes(hash).to_u256();
    storage.seed = seed;
    seed
}

fun get_percent_range( point : u256,_percent:u32) : vector<Range>{
    let percent = _percent as u256;
    let len_unit = u256::max_value!() / (PERCENT_MAX as u256);
    let len = len_unit * percent;
    deposit_bonus::range::get_ranges(point,len)
}

public(package) fun get_hit_range(storage : &mut Storage,
                                random :&Random , 
                                time_ms : u64,
                                ctx : &mut TxContext) : vector<Range>
{
    let random_point = create_random_point(storage, random,time_ms, ctx);
    let hit_ranges = get_percent_range(random_point, storage.bonus_percent );
    hit_ranges
}

public(package) fun get_hit_users(storage : &mut Storage,
                                    random :&Random ,
                                    time_ms : u64, 
                                    ctx : &mut TxContext) : LinkedTable<address,u256>
{
    let hit_ranges = get_hit_range(storage, random,time_ms, ctx);
    let user_shares = &storage.user_shares;
    let mut i  = 0;
    let mut hit_user_shares = linked_table::new<address,u256>(ctx);
    log(b"---hit--ranges----:",&deposit_bonus::range::encode_ranges(&hit_ranges).to_ascii_string());
    while(i < user_shares.size()){
       
        let user_share = user_shares.at(i);
        let user_range = deposit_bonus::range::get_address_ranges(user_share.id, user_share.share_amount as u256 );
        log(b"---user_range----",&user_range);
        let overlap_len = deposit_bonus::range::get_overlap_length(&user_range, &hit_ranges);
        log(b"overlapped len ",&overlap_len);
        if(overlap_len > 0) {
            linked_table::push_back(&mut hit_user_shares, user_share.id, overlap_len);
        };
        i  = i + 1;
    };

    hit_user_shares 
}

use sui::vec_map::VecMap;
public(package) fun convert_to_vector(t : &LinkedTable<address,u256>) :vector<Share>{
    let mut ret = vector<Share>[];
    let mut node = t.front();
    while(! node.is_none()){
        let addr = * node.borrow();
        let amount =  t.borrow(addr);
        ret.push_back(Share{
            id :  addr,
            amount : (* amount) as u64
        });
        node = t.next(addr);
    };
    ret
}

entry fun entry_withdraw(clock: &Clock,storage: & mut Storage,system_state: &mut SuiSystemState,
                        amount : u64,ctx : &mut TxContext){
    let balance = withdraw(clock, storage, system_state,
                            amount, ctx);
    let coin = coin::from_balance<SUI>(balance,ctx);
    transfer::public_transfer(coin, ctx.sender());
}

//operatorCap owner transfer operatoerCap to other 
entry fun assign_operator( _ : &AdminCap,operator_cap : &mut OperatorCap, to :address){
    if(!operator_cap.operators.contains(&to)){
        operator_cap.operators.push_back(to);
    }
}

entry fun change_bonus_percent(_ :&AdminCap,storage : &mut Storage, percent : u32){
    assert!(percent <= BonusLimit , err_consts::percent_out_of_range!());
    storage.bonus_percent = percent;
}

entry fun change_fee_percent(_ :&AdminCap,storage : &mut Storage, percent : u32){
    assert!(percent <= FeeLimit, err_consts::fee_percent_out_of_range!());
    storage.fee_percent = percent;
}

public fun get_share_amount (storage: & Storage,user : address) : u64{
    
    let user_share = get_share(storage,user);
    user_share.share_amount
}

// public fun get_share_amount(storage: & Storage,ctx : &mut TxContext) : u64{
//     get_share_by_user(storage,ctx.sender())
// }

public(package) fun get_share(storage: & Storage,user : address) : &UserShare{
    storage.user_shares.borrow(user)
}

public fun  query_user_by_addr(storage : &Storage, sender : address) : UserInfo
{
    assert!(storage.user_shares.contains(sender),err_consts::account_not_exists!());
    
    let share = storage.user_shares.borrow( sender);
    let share_money = (share.share_amount as u128) * (storage.total_staked as u128) / (storage.total_shares as u128);
    let share_money = share_money as u64;
    assert!(share_money >= share.original_money);
    let bonus = share.bonus;
    UserInfo{
        id : sender,
        orignal_amount : share.original_money,
        reward : share_money - share.original_money,
        bonus : bonus,
    }
}

public fun query_user_info(storage : &Storage, ctx : &TxContext) :UserInfo{
    let sender =  ctx.sender();
    query_user_by_addr(storage,sender)
}
/**
ui show user info :
sui */
entry fun  entry_query_user_info(storage : &Storage, ctx : &TxContext) {
    let user_info = query_user_info(storage, ctx);   
    emit(user_info );
}

/**
withdraw less than amount
*/
public fun withdraw_bonus(storage : &mut Storage,amount : u64, ctx : &mut TxContext) :Balance<SUI> {
    let sender = ctx.sender(); 
    if(!storage.user_shares.contains(sender)){
        return balance::zero()
    };
    let user_share = storage.user_shares.borrow_mut(sender);
    assert!( user_share.bonus <= storage.bonus_balance.value());
 
    if(user_share.bonus == 0){
        return balance::zero()
    };

    if(user_share.bonus > amount ){
        let balance = storage.bonus_balance.split(amount);
        user_share.bonus = user_share.bonus - amount;
        balance
    }
    else{

        let balance = storage.bonus_balance.split(user_share.bonus);
        user_share.bonus = 0;
        balance
    }

}

public struct WithdrawEvent has copy,drop{
    sender : address,
    request_amount : u64,
    receive_amount : u64,
}

entry fun withdraw_fee(_:&AdminCap,storage : &mut Storage,amount : u64 ,ctx : &mut TxContext){
    assert!(amount <= storage.fee_balance.value());
    let balance = storage.fee_balance.split(amount);
    let coin = coin::from_balance(balance, ctx);
    transfer::public_transfer(coin, ctx.sender());
}

entry fun entry_withdraw_bonus(storage : &mut Storage, amount : u64 ,ctx : &mut TxContext){
    let sender = ctx.sender();
    let balance = withdraw_bonus(storage,amount,ctx);
    if(balance.value() > 0){
        let coin = coin::from_balance(balance,ctx);
        emit(WithdrawEvent{
            sender,
            request_amount  : amount,
            receive_amount : coin.value(),
        });
        transfer::public_transfer(coin, sender);
    }
    else{
        balance.destroy_zero();
    }
}

#[test_only]
public fun init_for_testing(ctx : &mut TxContext){
    init(ctx);
}


public(package) entry fun donate_bonus(storage : &mut Storage, coin : Coin<SUI>){
    storage.bonus_donated.join(coin.into_balance());
}