module game_park::gp;

use sui::balance::{Self, Supply, Balance};
use sui::coin::{Self, Coin};
use sui::package::Publisher;
use sui::sui::SUI;
use sui::url;

// constant
const Exchange_Ratio_In: u64 = 100;
const Exchange_Ratio_Out: u64 = 99;
const Sui_Decimals: u64 = 1_000_000_000;
// error code
const E_Not_Valid_Sui_in: u64 = 0;
const E_Not_Valid_GP_in: u64 = 1;
const E_Not_Withdraw: u64 = 2;

public struct GP has drop {}

public struct GPTreasuryCap has key {
    id: UID,
    supply: Supply<GP>
}

public struct Pool has key {
    id: UID,
    funds: Balance<SUI>,
    earned: Balance<SUI>
}

fun init(otw: GP, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        otw,
        0,
        b"GP",
        b"Game Park Coin",
        b"The universal currency used in the Game Park.",
        option::some(url::new_unsafe_from_bytes(b"https://mainnet-aggregator.hoh.zone/v1/blobs/FyGhvIOtfvviqRLDc-lnCSXNaPQNNiUFPbaXb9Gtjmc")),
        ctx
    );

    transfer::public_freeze_object(metadata);
    let supply = treasury.treasury_into_supply();
    transfer::share_object(GPTreasuryCap {
        id: object::new(ctx),
        supply
    });

    transfer::share_object(Pool {
        id: object::new(ctx),
        funds: balance::zero<SUI>(),
        earned: balance::zero<SUI>()
    });
}

fun mint(treasury: &mut GPTreasuryCap, amount: u64, ctx: &mut TxContext): Coin<GP> {
    treasury.supply.increase_supply(amount).into_coin(ctx)
}

#[allow(lint(self_transfer))]
fun add_to_pool(pool: &mut Pool, mut in: Coin<SUI>, count: u64, ctx: &mut TxContext) {
    // 99% -> funds
    // 1% -> earned
    pool.funds.join(in.split(count * Sui_Decimals * Exchange_Ratio_Out / 100, ctx).into_balance());
    pool.earned.join(in.split(count * Sui_Decimals * (100 - Exchange_Ratio_Out) / 100, ctx).into_balance());
    // Dispose of remaining coin
    if (in.value() == 0) {
        in.destroy_zero();
    } else {
        transfer::public_transfer(in, ctx.sender());
    };
}

entry fun buy(treasury: &mut GPTreasuryCap, pool: &mut Pool, in: Coin<SUI>, ctx: &mut TxContext) {
    // Only integer recharge is supported
    let count = in.value() / Sui_Decimals;
    assert!(count > 0, E_Not_Valid_Sui_in);
    // add to pool
    add_to_pool(pool, in, count, ctx);
    // mint and transfer
    transfer::public_transfer(mint(treasury, count * Exchange_Ratio_In, ctx), ctx.sender());
}

fun burn(treasury: &mut GPTreasuryCap, balance: Balance<GP>): u64 {
    treasury.supply.decrease_supply(balance)
}

public fun swap_out(count: u64): u64 {
    count * Sui_Decimals / Exchange_Ratio_In * Exchange_Ratio_Out / 100
}

public fun consume(treasury: &mut GPTreasuryCap, pool: &mut Pool, in: Coin<GP>) {
    // burn
    let count = burn(treasury, in.into_balance());
    // check zero
    assert!(count > 0, E_Not_Valid_GP_in);
    // add to pool.earned
    pool.earned.join(pool.funds.split(swap_out(count)));
}

entry fun sell(treasury: &mut GPTreasuryCap, pool: &mut Pool, in: Coin<GP>, ctx: &mut TxContext) {
    // burn
    let count = burn(treasury, in.into_balance());
    // check zero
    assert!(count > 0, E_Not_Valid_GP_in);
    transfer::public_transfer(
        pool.funds.split(swap_out(count)).into_coin(ctx),
        ctx.sender()
    );
}

entry fun withdraw(_: &Publisher, treasury: &GPTreasuryCap, pool: &mut Pool, ctx: &mut TxContext) {
    // Correct the precision error of the previous "floor" division method
    let supply = treasury.supply.supply_value();
    let need = swap_out(supply);
    let amount = if (pool.funds.value() > need) pool.funds.value() - need else 0;
    pool.earned.join(pool.funds.split(amount));
    assert!(pool.earned.value() > 0, E_Not_Withdraw);
    transfer::public_transfer(pool.earned.withdraw_all().into_coin(ctx), ctx.sender());
}

public entry fun charity_invest(pool: &mut Pool, in: Coin<SUI>) {
    // Invest in in-game rewards that are generated out of thin air
    // In the future, staking tokens to earn income will be an alternative form
    pool.earned.join(in.into_balance());
}

public fun draw_rewards(_: &Publisher, treasury: &mut GPTreasuryCap, pool: &mut Pool, amount: u64, ctx: &mut TxContext): Coin<GP> {
    pool.funds.join(pool.earned.split(amount * Sui_Decimals / Exchange_Ratio_In));
    mint(treasury, amount, ctx)
}