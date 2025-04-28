module card::card;

use std::debug::print;
use sui::balance::{Self, Balance, zero};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::vec_map::{Self, VecMap};

const ENTRY_FEE: u64 = 200_000_000;
const ECoinBalanceNotEnough: u64 = 1; // 余额不足
const ECountNotEnough: u64 = 2; // 数量不足
const EPlayerAlreadySubmitted: u64 = 3; // 玩家已提交
const EPlayerLimitReached: u64 = 5; // 超过当天玩家数量限制

const MAX_PLAYERS_PER_DAY: u64 = 5; // 每天最多25人提交

// 金库
public struct Vault has key, store {
    id: UID,
    prize_pool: Balance<SUI>,
    leaderboard: VecMap<address, u64>,
    paid_players: vector<address>,
    first_player: address,
    last_settled_day: u64, // 最后结算日
    today_submit_count: u64, // 当天已提交的人数
}

public struct IncentiveSubmitEvent has copy, drop {
    endPlayer: address,
    endAmount: u64,
    ownPlayer: address,
    ownAmount: u64,
    firstPlayer: address,
    firstAmount: u64,
}

public struct DailyLeaderboardEvent has copy, drop {
    player: address,
    card_count: u64,
}

public struct FirstEvent has copy, drop {
    player: address,
}

public struct PaymentEvent has copy, drop {
    amount: u64,
}

fun init(ctx: &mut TxContext) {
    let pool = Vault {
        id: object::new(ctx),
        prize_pool: zero(),
        leaderboard: vec_map::empty(),
        paid_players: vector::empty(),
        first_player: @0x0,
        last_settled_day: 0,
        today_submit_count: 0,
    };
    transfer::share_object(pool);
}

// 抽卡付费
#[allow(lint(self_transfer))]
public fun payment(mut amount: Coin<SUI>, vault: &mut Vault, ctx: &mut TxContext) {
    assert!(amount.balance().value() >= ENTRY_FEE, ECoinBalanceNotEnough);

    let sender = tx_context::sender(ctx);
    let excess_amount = coin::value(&mut amount) - ENTRY_FEE;

    if (excess_amount > 0) {
        let excess_coin = coin::split(&mut amount, excess_amount, ctx);
        transfer::public_transfer(excess_coin, sender);
    };

    let split_balance = coin::into_balance(amount);
    vault.prize_pool.join(split_balance);
    vector::push_back(&mut vault.paid_players, sender);
    event::emit(PaymentEvent { amount: vault.prize_pool.value() });
}

// 普通提交
// 提交，增加 current_day 参数
public fun submit(card_count: u64, current_day: u64, vault: &mut Vault, ctx: &mut TxContext) {
    assert!(card_count > 0, ECountNotEnough);
assert!(current_day > vault.last_settled_day, ECountNotEnough);
    let sender = tx_context::sender(ctx);
    assert!(!vault.leaderboard.contains(&sender), EPlayerAlreadySubmitted);

    assert!(vault.today_submit_count < MAX_PLAYERS_PER_DAY, EPlayerLimitReached);

    if (vault.first_player == @0x0 && vector::contains(&vault.paid_players, &sender)) {
        vault.first_player = sender;
        event::emit(FirstEvent { player: sender });
    };

    vault.leaderboard.insert(sender, card_count);
    vault.today_submit_count = vault.today_submit_count + 1;

    event::emit(DailyLeaderboardEvent { player: sender, card_count });

    // 如果 leaderboard 满5人，且当天还没结算
    if (vec_map::size(&vault.leaderboard) == 5 && current_day > vault.last_settled_day) {
        if (vault.prize_pool.value() >= ENTRY_FEE) {
            incentive_submit(card_count, vault, ctx);
        } else {
            clear_leaderboard(vault);
        };
        vault.today_submit_count = 0;
        vault.last_settled_day = current_day;
    }
}

// 激励提交
#[allow(lint(self_transfer))]
public fun incentive_submit(card_count: u64, vault: &mut Vault, ctx: &mut TxContext) {
    assert!(vault.prize_pool.value() >= ENTRY_FEE, ECoinBalanceNotEnough);
    assert!(card_count > 0, ECountNotEnough);

    let sender = tx_context::sender(ctx);
    let total_value = value(vault);

    let first_value = (total_value * 2) / 6;
    let frist_amount = coin::take(&mut vault.prize_pool, first_value, ctx);
    transfer::public_transfer(frist_amount, vault.first_player);

    let end_value = (total_value * 1) / 6;
    let end_amount = coin::take(&mut vault.prize_pool, end_value, ctx);

    let own = get_max_card_user(vault);
    let own_value = vault.prize_pool.value();
    let own_amount = coin::from_balance(balance::withdraw_all(&mut vault.prize_pool), ctx);

    event::emit(IncentiveSubmitEvent {
        endPlayer: sender,
        endAmount: end_value,
        ownPlayer: own,
        ownAmount: own_value,
        firstPlayer: vault.first_player,
        firstAmount: first_value,
    });

    transfer::public_transfer(own_amount, own);
    transfer::public_transfer(end_amount, sender);

    vault.first_player = @0x0;
    clear_leaderboard(vault);
}

// 清空排行榜和付费玩家
fun clear_leaderboard(vault: &mut Vault) {
    while (!vec_map::is_empty(&vault.leaderboard)) {
        let (_, _) = vec_map::pop(&mut vault.leaderboard);
    };
    while (!vector::is_empty(&vault.paid_players)) {
        vector::pop_back(&mut vault.paid_players);
    };
}

// 获取最大卡数的玩家
public fun get_max_card_user(vault: &mut Vault): address {
    let len = vec_map::size(&vault.leaderboard);
    assert!(len > 0, ECountNotEnough);

    let mut max_address = @0x0;
    let mut max_value = 0u64;
    let mut i = 0;

    while (i < len) {
        let (address, value) = vec_map::get_entry_by_idx_mut(&mut vault.leaderboard, i);
        if (*value > max_value) {
            max_value = *value;
            max_address = *address;
        };
        i = i + 1;
    };
    max_address
}

// 查询奖池数额
public fun value(vault: &Vault): u64 {
    vault.prize_pool.value()
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
