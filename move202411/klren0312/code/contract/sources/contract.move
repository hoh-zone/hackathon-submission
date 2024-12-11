// updatecap 0x514cfd7d469989286645eb4b97f9e11a9e9a7abe6574a6ba2496a3d70d8301a7
module contract::sui_hai {
  use sui::coin::{Self, value, Coin};
  use sui::sui::SUI;
  use std::string::{utf8, String};
  use sui::balance::{Self, zero, Balance};
  use sui::table::{Self, Table};
  use contract::member::{create_member_nft, get_member_struct, Member};
  use sui::event;

  // 存的钱和数量不符
  const ErrorDepositNotEnough: u64 = 0;

   // 当前会员已存在
  const ErrorAlreadyHasMember: u64 = 1;

 // 管理员权限
  public struct AdminCap has key {
    id: UID
  }

  // 创建会员事件
  public struct CreateMemberEvent has copy, drop {
    member: address,
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    index: u64,
  }

  // 系统结构体
  public struct SuiHaiServer has key {
    id: UID,
    name: String,
    pool_balance: Balance<SUI>, // 资金池
    activity_fee: u64, // 活动提现手续费， 总价 / 手续费 = 提现的费用
    members: Table<address, Member>,
    activity_max_join_fee: u64 // 活动收费最高限制
  }

  // 初始化，创建系统
  fun init (ctx: &mut TxContext) {
    let suiHaiServer = SuiHaiServer {
      id: object::new(ctx),
      name: utf8(b"SUI-HAI-SERVER"),
      pool_balance: zero(), // 资金池
      activity_fee: 10000, // 万一手续费
      members: table::new<address, Member>(ctx),
      activity_max_join_fee: 100_000_000_000
    };
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, tx_context::sender(ctx));
    transfer::share_object(suiHaiServer);
  }

  // 管理员修改活动基础手续费
  public fun change_activity_fee (
    _: &AdminCap,
    sui_hai_server: &mut SuiHaiServer,
    fee: u64
  ) {
    sui_hai_server.activity_fee = fee;
  }

  // 获取活动基础手续费
  public(package) fun get_activity_fee (
    sui_hai_server: &SuiHaiServer,
  ): u64 {
    sui_hai_server.activity_fee
  }

  // 手续费充入池子
  public(package) fun join_activity_fee (
    sui_hai_server: &mut SuiHaiServer,
    activity_fee_balance: Balance<SUI>,
  ) {
    sui_hai_server.pool_balance.join(activity_fee_balance);
  }

  // 服务器存钱
  public entry fun deposit(
    sui_hai_server: &mut SuiHaiServer,
    input: Coin<SUI>,
    amount: u64,
    ctx: &mut TxContext
  ) {
    let input_value = value(&input);
    assert!(input_value >= amount, ErrorDepositNotEnough);

    let mut input_balance = coin::into_balance(input);
    if (input_value > amount) {
        balance::join(
            &mut sui_hai_server.pool_balance,
            balance::split(&mut input_balance, amount)
        );
        let change = coin::from_balance(input_balance, ctx);
        transfer::public_transfer(change, tx_context::sender(ctx));
    } else {
        balance::join(&mut sui_hai_server.pool_balance, input_balance);
    }
  }

  // 服务器取钱
  public entry fun withdraw(
    _: &AdminCap,
    sui_hai_server: &mut SuiHaiServer,
    amount: u64,
    ctx: &mut TxContext
  ) {
      let output_balance = balance::split(&mut sui_hai_server.pool_balance, amount);
      let output = coin::from_balance(output_balance, ctx);
      transfer::public_transfer(output, tx_context::sender(ctx));
  }

    // 会员注册
  public entry fun add_memeber (
    sui_hai_server: &mut SuiHaiServer,
    nickname: String,
    description: String,
    sex: String,
    avatar: String,
    ctx: &mut TxContext
  ) {
    // 已经注册过的，不给再注册了
    if (sui_hai_server.members.contains(ctx.sender())) {
      abort ErrorAlreadyHasMember
    };
    let index = sui_hai_server.members.length();
    let current_index = index + 1;
    let member = get_member_struct(
      nickname,
      description,
      sex,
      avatar,
      current_index,
    );
    // 添加会员信息到总服务器
    sui_hai_server.members.add(ctx.sender(), member);
    create_member_nft(
      nickname,
      description,
      sex,
      avatar,
      current_index,
      ctx,
    );

    // 会员注册事件
    event::emit(CreateMemberEvent {
      member: ctx.sender(),
      nickname,
      description,
      sex,
      avatar,
      index: current_index,
    })
  }
}
