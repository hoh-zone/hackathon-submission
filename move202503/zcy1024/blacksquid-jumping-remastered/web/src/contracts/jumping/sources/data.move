module jumping::data;

use std::string::String;
use game_park::gp::GP;
use jumping::nft::BlackSquidJumpingNFT;
use sui::balance::{Self, Balance};
use sui::coin::Coin;
use sui::event;
use sui::package::Publisher;
use sui::random::Random;
use sui::table::{Self, Table};
use sui::vec_map::{Self, VecMap};

// error code
const E_Not_Valid_GP_Amount: u64 = 0;
const E_Not_Enough_Steps: u64 = 1;
const E_Not_Have_Empty_Game_Place: u64 = 2;
const E_Not_Same_index: u64 = 3;

public struct GameData has store {
    list: u64,
    row: u8,
    end: u64,
    cur_step_paid: Balance<GP>,
    final_reward: Balance<GP>
}

public struct UserInfo has store {
    steps: Balance<GP>,
    hash_data: VecMap<String, GameData>
}

public struct DataPool has key {
    id: UID,
    pool_table: Table<ID, UserInfo>,
    rewards: Balance<GP>
}

public struct EndlessGame has key {
    id: UID,
    idx: u8,
    data: GameData
}

public struct StepResult has copy, drop {
    user_pos: u8,
    safe_pos: u8
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(DataPool {
        id: object::new(ctx),
        pool_table: table::new<ID, UserInfo>(ctx),
        rewards: balance::zero<GP>()
    });
    transfer::share_object(EndlessGame {
        id: object::new(ctx),
        idx: 0,
        data: GameData {
            list: 0,
            row: 0,
            end: 100,
            cur_step_paid: balance::zero<GP>(),
            final_reward: balance::zero<GP>()
        }
    })
}

public fun new_game(data_pool: &mut DataPool, nft_id: ID, hash_key: String, gp: Coin<GP>) {
    assert!(gp.value() == 10, E_Not_Valid_GP_Amount);
    let value = GameData {
        list: 0,
        row: 0,
        end: 10,
        cur_step_paid: balance::zero<GP>(),
        final_reward: data_pool.rewards.split(20)
    };
    if (!data_pool.pool_table.contains(nft_id)) {
        data_pool.pool_table.add(nft_id, UserInfo {
            steps: balance::zero<GP>(),
            hash_data: vec_map::empty<String, GameData>()
        });
    };
    let user_info = &mut data_pool.pool_table[nft_id];
    assert!(user_info.hash_data.size() < 2, E_Not_Have_Empty_Game_Place);
    user_info.steps.join(gp.into_balance());
    user_info.hash_data.insert(hash_key, value);
}

public fun new_game_with_nft(data_pool: &mut DataPool, nft: &BlackSquidJumpingNFT, hash_key: String, gp: Coin<GP>) {
    new_game(data_pool, object::id(nft), hash_key, gp);
}

fun rand_num(random: &Random, ctx: &mut TxContext): u8 {
    let mut generator = random.new_generator(ctx);
    generator.generate_u8_in_range(0, 1)
}

fun distribute_step_rewards(data: &mut GameData, next_pos: u8, receipt: address, ctx: &mut TxContext) {
    data.list = data.list + 1;
    data.row = next_pos;

    let mut user_rewards = balance::zero<GP>();
    // split half cur step reward
    let cur_step_reward_amount = data.cur_step_paid.value() / 2;
    if (cur_step_reward_amount > 0) {
        user_rewards.join(data.cur_step_paid.split(cur_step_reward_amount));
    };
    // split final reward
    let split_final_reward_amount = data.final_reward.value() / (data.end - data.list + 1);
    if (split_final_reward_amount > 0) {
        user_rewards.join(data.final_reward.split(split_final_reward_amount));
    };

    if (data.list < data.end) {
        // accumulate rewards
        data.final_reward.join(data.cur_step_paid.withdraw_all());
    } else {
        // user witheraw all
        user_rewards.join(data.cur_step_paid.withdraw_all());
    };

    // transfer user rewards
    if (user_rewards.value() > 0) {
        transfer::public_transfer(user_rewards.into_coin(ctx), receipt);
    } else {
        user_rewards.destroy_zero();
    };
}

entry fun buy_steps(data_pool: &mut DataPool, nft_id: ID, gp: Coin<GP>) {
    let user_info = &mut data_pool.pool_table[nft_id];
    user_info.steps.join(gp.into_balance());
}

fun drop_game_data(data_pool: &mut DataPool, nft_id: ID, hash_key: String) {
    let user_info = &mut data_pool.pool_table[nft_id];
    let (_, GameData {
        list: _,
        row: _,
        end: _,
        cur_step_paid,
        final_reward
    }) = user_info.hash_data.remove(&hash_key);
    cur_step_paid.destroy_zero();
    final_reward.destroy_zero();
}

entry fun next_step(
    _: &Publisher,
    data_pool: &mut DataPool,
    nft_id: ID,
    hash_key: String,
    user_pos: u8,
    random: &Random,
    receipt: address,
    ctx: &mut TxContext)
{
    let user_info = &mut data_pool.pool_table[nft_id];
    assert!(user_info.steps.value() > 0, E_Not_Enough_Steps);
    let data = &mut user_info.hash_data[&hash_key];
    data.cur_step_paid.join(user_info.steps.split(1));

    let safe_pos = rand_num(random, ctx);
    // success
    if (user_pos == safe_pos) {
        distribute_step_rewards(data, user_pos, receipt, ctx);
        // check if can end the game
        if (data.list == data.end) {
            drop_game_data(data_pool, nft_id, hash_key);
        };
    } else {
        data.end = data.end + 1;
    };
    event::emit(StepResult {
        user_pos,
        safe_pos,
    });
}

fun reset_endless_game(endless_game: &mut EndlessGame) {
    endless_game.idx = (endless_game.idx + 1) % 100;
    endless_game.data.list = 0;
    endless_game.data.row = 0;
    endless_game.data.end = 100;
}

entry fun endless_next_step(
    _: &Publisher,
    data_pool: &mut DataPool,
    nft_id: ID,
    endless_game: &mut EndlessGame,
    endless_idx: u8,
    user_pos: u8,
    random: &Random,
    receipt: address,
    ctx: &mut TxContext)
{
    let user_info = &mut data_pool.pool_table[nft_id];
    assert!(user_info.steps.value() > 0, E_Not_Enough_Steps);
    assert!(endless_game.idx == endless_idx, E_Not_Same_index);
    let data = &mut endless_game.data;
    data.cur_step_paid.join(user_info.steps.split(1));

    let safe_pos = rand_num(random, ctx);
    // success
    if (user_pos == safe_pos) {
        distribute_step_rewards(data, user_pos, receipt, ctx);
        // check if can end the game
        if (data.list == data.end) {
            reset_endless_game(endless_game);
        };
    } else {
        data.end = data.end + 1;
    };
    event::emit(StepResult {
        user_pos,
        safe_pos,
    });
}

public entry fun charity_invest(data_pool: &mut DataPool, gp: Coin<GP>) {
    data_pool.rewards.join(gp.into_balance());
}

entry fun withdraw(_: &Publisher, data_pool: &mut DataPool, amount: u64, ctx: &mut TxContext) {
    transfer::public_transfer(data_pool.rewards.split(amount).into_coin(ctx), ctx.sender());
}

#[allow(lint(self_transfer))]
public fun clear_user_info(data_pool: &mut DataPool, nft: BlackSquidJumpingNFT, ctx: &mut TxContext) {
    let id = object::id(&nft);
    let UserInfo {
        mut steps,
        mut hash_data
    } = data_pool.pool_table.remove(id);
    while (!hash_data.is_empty()) {
        let (_, GameData {
            list: _,
            row: _,
            end: _,
            mut cur_step_paid,
            mut final_reward
        }) = hash_data.pop();
        final_reward.join(cur_step_paid.withdraw_all());
        if (final_reward.value() <= 20) {
            data_pool.rewards.join(final_reward.withdraw_all());
        } else {
            let extra_reward_amount = (final_reward.value() - 20) / 10;
            data_pool.rewards.join(final_reward.split(20 + extra_reward_amount));
            steps.join(final_reward.withdraw_all());
        };
        cur_step_paid.destroy_zero();
        final_reward.destroy_zero();
    };
    transfer::public_transfer(steps.into_coin(ctx), ctx.sender());
    hash_data.destroy_empty();
    nft.burn();
}