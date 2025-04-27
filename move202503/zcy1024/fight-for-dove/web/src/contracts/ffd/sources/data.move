module ffd::data;

use std::string::String;
use std::u64;
use sui::coin::Coin;
use sui::package::Publisher;
use sui::random::Random;
use sui::table::{Self, Table};
use ffd::nft::FightForDoveNFT;
use ffd::props::{Self, Props, PropsList};
use game_park::gp::{GP, GPTreasuryCap, Pool};

const E_Not_Enough_GP: u64 = 0;
const E_Not_Ready_To_NewGame: u64 = 1;
const E_Not_Enough_NewGame_Amount: u64 = 2;
const E_Not_In_Game: u64 = 3;
const E_Can_Not_End_Game: u64 = 4;
const E_Not_End_Game: u64 = 5;
const E_Not_Enough_Skill_Points: u64 = 6;
const E_Not_Correct_Skill_Props: u64 = 7;

public struct UserInfo has store {
    game_state: String,
    can_new_game_amount: u64,
    total_game_amount: u64,
    owned_skill_points: u64,
    skill_points_by_game: u64,
    skill_props: Props,
    in_game_props: vector<Props>
}

public struct Data has key {
    id: UID,
    users: Table<address, UserInfo>
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Data {
        id: object::new(ctx),
        users: table::new<address, UserInfo>(ctx)
    });
}

fun new_user(data: &mut Data, user: address, ctx: &mut TxContext) {
    data.users.add(user, UserInfo {
        game_state: b"Ready".to_string(),
        can_new_game_amount: 0,
        total_game_amount: 0,
        owned_skill_points: 0,
        skill_points_by_game: 0,
        skill_props: props::generate_empty_skill_props(ctx),
        in_game_props: vector<Props>[]
    });
}

#[allow(lint(self_transfer))]
public fun buy_game_amount(data: &mut Data, mut gp: Coin<GP>, treasury: &mut GPTreasuryCap, pool: &mut Pool, ctx: &mut TxContext) {
    let buy_amount = gp.value() / 10;
    assert!(buy_amount > 0, E_Not_Enough_GP);
    // consume gp
    treasury.consume(pool, gp.split(buy_amount * 10, ctx));
    // deal with the last $GP
    if (gp.value() > 0) {
        transfer::public_transfer(gp, ctx.sender());
    } else {
        gp.destroy_zero();
    };
    // check new user
    if (!data.users.contains(ctx.sender())) {
        new_user(data, ctx.sender(), ctx);
    };
    // add amount to Data
    let user_info = &mut data.users[ctx.sender()];
    user_info.can_new_game_amount = user_info.can_new_game_amount + buy_amount;
}

entry fun new_game(_: &Publisher, data: &mut Data, user: address) {
    let user_info = &mut data.users[user];
    assert!(user_info.game_state == b"Ready".to_string(), E_Not_Ready_To_NewGame);
    user_info.game_state = b"1".to_string();
    assert!(user_info.can_new_game_amount > 0, E_Not_Enough_NewGame_Amount);
    user_info.can_new_game_amount = user_info.can_new_game_amount - 1;
    user_info.total_game_amount = user_info.total_game_amount + 1;
}

public fun next_level(_: &Publisher, data: &mut Data, user: address) {
    let user_info = &mut data.users[user];
    assert!(user_info.game_state != b"Ready".to_string() && user_info.game_state != b"End".to_string(), E_Not_In_Game);
    user_info.game_state.append_utf8(b"1");
}

entry fun end_game(_: &Publisher, data: &mut Data, user: address, skill_points: u64) {
    let user_info = &mut data.users[user];
    assert!(user_info.game_state != b"Ready".to_string() && user_info.game_state != b"End".to_string(), E_Can_Not_End_Game);
    user_info.game_state = b"End".to_string();
    // skill points
    let can_owned_skill_points = if (user_info.skill_points_by_game >= 999) 0 else 999 - user_info.skill_points_by_game;
    let real_skill_points = u64::min(skill_points, can_owned_skill_points);
    user_info.owned_skill_points = user_info.owned_skill_points + real_skill_points;
    user_info.skill_points_by_game = user_info.skill_points_by_game + real_skill_points;
}

fun deal_with_in_game_props(user_info: &mut UserInfo, nft: &mut FightForDoveNFT, ids: vector<ID>) {
    while (user_info.in_game_props.length() > 0) {
        let props = user_info.in_game_props.pop_back();
        props.deal_with_in_game_props(nft, &ids);
    };
}

entry fun ready_new_game(data: &mut Data, nft: &mut FightForDoveNFT, ids: vector<ID>, ctx: &TxContext) {
    let user_info = &mut data.users[ctx.sender()];
    assert!(user_info.game_state == b"End".to_string(), E_Not_End_Game);
    user_info.game_state = b"Ready".to_string();
    deal_with_in_game_props(user_info, nft, ids);
}

entry fun drop_all_to_new_game(_: &Publisher, data: &mut Data, user: address) {
    let user_info = &mut data.users[user];
    assert!(user_info.game_state == b"End".to_string(), E_Not_End_Game);
    user_info.game_state = b"Ready".to_string();
    while (user_info.in_game_props.length() > 0) {
        let props = user_info.in_game_props.pop_back();
        props.burn_props();
    };
}

fun consume_skill_points(data: &mut Data, user: address, points: u64) {
    let user_info = &mut data.users[user];
    assert!(user_info.owned_skill_points >= points, E_Not_Enough_Skill_Points);
    user_info.owned_skill_points = user_info.owned_skill_points - points;
}

fun add_skill_points(data: &mut Data, user: address, points: u64) {
    let user_info = &mut data.users[user];
    user_info.owned_skill_points = user_info.owned_skill_points + points;
}

entry fun generate_in_game_props(
    _: &Publisher,
    data: &mut Data,
    user: address,
    list: &PropsList,
    random: &Random,
    ctx: &mut TxContext
) {
    let user_info = &mut data.users[user];
    assert!(user_info.game_state != b"Ready".to_string() && user_info.game_state != b"End".to_string(), E_Not_In_Game);
    let level = user_info.game_state.length() - 1;
    user_info.in_game_props.push_back(list.generate_new_in_game_props(level, random, ctx));
}

public fun generate_skill_props(data: &mut Data, points: u64, ctx: &mut TxContext): Props {
    consume_skill_points(data, ctx.sender(), points);
    props::generate_skill_props(points, ctx)
}

public fun consume_skill_props(data: &mut Data, props: Props, points: u64, ctx: &TxContext) {
    assert!(props.get_props_type() == b"skill".to_string() && props.get_props_effect(b"points".to_string()) == points.to_string(), E_Not_Correct_Skill_Props);
    props.burn_props();
    add_skill_points(data, ctx.sender(), points);
}

// public fun learn_skill(_: &Publisher, data: &mut Data, user: address) {
// }