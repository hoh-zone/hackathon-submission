
module buzzing::buzzing;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::event::{Self};
use sui::coin::{Self, Coin};
use sui::dynamic_field;
// use sui::dynamic_field::{Self};

public struct BUZZING has drop {}

public struct OracleCap has key {
    id: UID,
}

public struct AdminCap has key {
    id: UID,
}

const MarketStatus_Created:u8 = 0;
const MarketStatus_TokenCreated:u8 = 1;
const MarketStatus_Reported:u8 = 2;
const MarketStatus_Closed:u8 = 3;

const E_ABORT:u64 = 0;
const E_NOT_FOUND:u64 = 1;

public struct Global has key,store {
    id: UID,
    // save market list 
    markets: vector<ID>,

    // last question index
    last_question_index: u64,
}

public struct Market <phantom StakeToken> has key, store {
    id: UID,
    question: String,
    question_index: u64,
    // package address, you can find token $package::token::Token 
    token_metas: vector<address>,
    token_pools: vector<address>,

    // options count now is 2 Yes | No
    options_count: u8,

    stake_tokens: Balance<StakeToken>,
    status: u8,

    partitions: vector<u8>,
    
    oracle_cap: Option<ID>,
    
}

public struct EventMarketCreated has drop,copy {
    market_id: ID,
}


fun init(_witness: BUZZING, ctx: &mut TxContext) {
    let markets = Global {
        id: object::new(ctx),
        markets: vector[],
        last_question_index: 20250501,
    };
    transfer::public_share_object(markets);

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());

}

public entry fun create_market<T>(
    question: String,
    options_count: u8,
    stake_coin: Coin<T>,
    global: &mut Global,
    ctx: &mut TxContext
) {    

    let oracle_cap = OracleCap {
        id: object::new(ctx),
    };
    
    let mut market = Market<T> {
        id: object::new(ctx),
        question,
        token_metas: vector[],
        options_count,
        stake_tokens: balance::zero(),
        status: MarketStatus_Created,
        question_index: global.last_question_index,
        partitions: vector[],
        token_pools: vector[],
        oracle_cap: option::some(object::id(&oracle_cap)),
    };
    transfer::transfer(oracle_cap, ctx.sender());

    // emit event
    event::emit(EventMarketCreated {
        market_id: object::id(&market),
    });

    global.markets.push_back(object::id(&market));
    global.last_question_index = global.last_question_index + 1;

    let stake_coin_balance = coin::into_balance(stake_coin);
    market.stake_tokens.join(stake_coin_balance);
    transfer::public_share_object(market);

}

public entry fun report_market<T>(
    _cap: &OracleCap,
    market: &mut Market<T>,
    partitions: vector<u8>,
) {
    assert!(market.status == MarketStatus_TokenCreated, E_ABORT);
    assert!(partitions.length() == market.options_count as u64, E_ABORT);
    assert!(option::is_some(&market.oracle_cap),E_ABORT);
    let cap_ref = option::borrow(&market.oracle_cap);
    assert!(object::id(_cap) == *cap_ref,E_ABORT);
    market.partitions = partitions;
    market.status = MarketStatus_Reported;
}

public entry fun fill_market<T>(
    _cap: &AdminCap,
    market: &mut Market<T>,
    token_metas: vector<address>,
    token_pools: vector<address>,
    _ctx: &mut TxContext,
) {
    market.token_metas = token_metas;
    market.token_pools = token_pools;
    market.status = MarketStatus_TokenCreated;
}

public entry fun close_market<T>(
    _cap: &AdminCap,
    market: &mut Market<T>
) {
    market.status = MarketStatus_Closed;
}

public fun buzzing_partion<T>(
    market: &Market<T>,
    find_address: address,
) : u8 {
    assert!(market.token_metas.length() > 0, E_ABORT);
    assert!(market.partitions.length() > 0, E_ABORT);
    assert!(market.token_metas.length() == market.partitions.length(), E_ABORT);

    let len = market.token_metas.length();
    let mut i = 0;
    while (i < len) {
        if (market.token_metas[i] == find_address) {
            return market.partitions[i]
        };
        i = i + 1;
    };

    abort(E_NOT_FOUND)
}

public fun get_reward_coin<StakeToken>(
    market: &mut Market<StakeToken>,
    amount: u64,
    ctx: &mut TxContext,
) : Coin<StakeToken> {
    coin::take<StakeToken>(&mut market.stake_tokens, amount, ctx)
}

public fun get_market_status<StakeToken>(
    market: &Market<StakeToken>,
) : u8 {
    market.status   
}

public entry fun register_valt<StakeToken,Token>(market: &mut Market<StakeToken>,name:vector<u8>){
    let token_balance = balance::zero<Token>();
    dynamic_field::add(&mut market.id,name, token_balance);   
}

public entry fun transfer_to_valut<StakeToken,Token>(market: &mut Market<StakeToken>,name:vector<u8>,coin:Coin<Token>){
    let current_balance = dynamic_field::borrow_mut<vector<u8>,Balance<Token>>(&mut market.id, name);
    current_balance.join(coin.into_balance());
}