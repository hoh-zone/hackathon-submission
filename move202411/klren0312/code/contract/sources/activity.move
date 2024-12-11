module contract::activity {
  use std::string::{String, utf8};
  use sui::vec_set::{empty, VecSet};
  use sui::balance::{Self,zero, Balance};
  use sui::sui::SUI;
  use sui::event;
  use sui::coin::{Coin, into_balance, value, from_balance};
  use contract::member::{MemberNft, add_point};
  use sui::url::{Url, new_unsafe};
  use contract::sui_hai::{get_activity_fee, join_activity_fee, SuiHaiServer};
  use sui::table::{Self, Table};

  // 参加活动费用不足
  const ErrorJoinFeeNotEnough: u64 = 0;
  // 活动人数已满
  const ErrorActivityFull: u64 = 1;
  // 会员未参与活动
  const ErrorMemberNotJoinActivity: u64 = 2;
  // 当前nft不匹配当前活动
  const ErrorNftNotMatchActivity: u64 = 3;
  // 已经评分
  const ErrorAlreadyScore: u64 = 4;
  // 评分无效
  const ErrorScoreInvalid: u64 = 5;

  public struct AdminCap has key {
    id: UID
  }

  // 创建活动事件
  public struct CreateActivityEvent has copy, drop {
    creator: address,
    activity_id: ID,
    title: String,
    description: String,
    date_range: vector<String>,
    location: String,
    media: vector<String>, // 媒体文件 图片
    tag: String,
    total_people_num: u64, // 人数
    join_fee: u64, // 参与费用
  }

  // 签到事件
  public struct CheckInEvent has copy, drop {
    activity_id: ID,
    join_activity_nft_id: ID,
  }

  // 评分事件
  public struct ScoreEvent has copy, drop {
    activity_id: ID,
    score: u8,
  }

  // 活动结构
  public struct Activity has key, store {
    id: UID,
    title: String, // 活动标题
    description: String, // 描述
    date_range: vector<String>, // 时间范围
    location: String, // 地点
    tag: String, // 分类
    total_people_num: u64, // 人数
    join_fee: u64, // 参与费用
    join_memeber: VecSet<address>, // 参加的成员列表
    media: vector<String>, // 媒体文件 图片
    total_price: Balance<SUI>, // 总活动资金
    score: u8, // 评分
    comments: Table<address,u8>, // 评分集合
  }

  // 活动创建nft
  public struct CreateActivityNft has key {
    id: UID,
    activity_id: ID,
    title: String,
    admin_cap: ID,
  }

  // 参与活动nft
  public struct JoinActivityNft has key {
    id: UID,
    activity_id: ID,
    name: String,
    url: Url,
    activity_title: String,
    join_time: String,
    check_in: bool, // 是否已签到
    index: u64, // 序号
  }

  // 创建活动
  public fun create_activity (
    member: &mut MemberNft,
    title: String, // 活动标题
    description: String, // 描述
    date_range: vector<String>, // 时间范围
    location: String, // 地点
    tag: String, // 分类
    total_people_num: u64, // 人数
    join_fee: u64,  // 参与费用
    media: vector<String>, // 图片
    ctx: &mut TxContext
  ) {
    let activity = Activity {
      id: object::new(ctx),
      title,
      description,
      date_range,
      location,
      tag,
      total_people_num,
      join_fee,
      join_memeber: empty(),
      media,
      total_price: zero(),
      score: 0,
      comments: table::new(ctx),
    };
    // 创建活动事件
    event::emit(CreateActivityEvent {
      activity_id: object::uid_to_inner(&activity.id),
      creator: ctx.sender(),
      title,
      description,
      date_range,
      location,
      media,
      tag,
      total_people_num,
      join_fee,
    });
    let admin_cap = AdminCap { id: object::new(ctx) };
    let create_activity_nft = CreateActivityNft {
      id: object::new(ctx),
      activity_id: object::uid_to_inner(&activity.id),
      title,
      admin_cap: object::uid_to_inner(&admin_cap.id),
    };
    // 添加积分
    add_point(member, 1);
    transfer::transfer(create_activity_nft, tx_context::sender(ctx));
    transfer::transfer(admin_cap, tx_context::sender(ctx));
    transfer::share_object(activity);
  }

  // 更新活动信息
  public fun update_activity (
    _: &AdminCap,
    activity: &mut Activity,
    title: String,
    description: String,
    date_range: vector<String>,
    location: String,
    tag: String,
    total_people_num: u64,
    join_fee: u64,
    media: vector<String>,
  ) {
    activity.title = title;
    activity.description = description;
    activity.date_range = date_range;
    activity.location = location;
    activity.tag = tag;
    activity.total_people_num = total_people_num;
    activity.join_fee = join_fee;
    activity.media = media;
  }

  // 参加活动
  public fun join_activity (
    member: &mut MemberNft,
    activity: &mut Activity,
    join_coin: Coin<SUI>,
    join_time: String,
    ctx: &mut TxContext,
  ) {
    // 活动人数已满
    assert!(activity.join_memeber.size() < activity.total_people_num, ErrorActivityFull);
    let join_coin_value = value(&join_coin);
    // 判断是否
    assert!(join_coin_value >= activity.join_fee, ErrorJoinFeeNotEnough);
    let join_coin_balance = into_balance(join_coin);
    // 成员加入列表
    activity.join_memeber.insert(ctx.sender());
    // 费用存入池中
    activity.total_price.join(join_coin_balance);
    let index = activity.join_memeber.size() + 1;
    let mut name = utf8(b"SUI-HAI-ACTIVITY-");
    name.append(activity.title);
    name.append(b"#".to_string());
    name.append(index.to_string());
    // 创建参与活动nft
    let join_activity_nft = JoinActivityNft {
      id: object::new(ctx),
      activity_id: object::uid_to_inner(&activity.id),
      name,
      url: new_unsafe(activity.media[0].to_ascii()),
      activity_title: activity.title,
      join_time,
      check_in: false,
      index,
    };
    // 增加积分
    add_point(member, 1);
    transfer::transfer(join_activity_nft, ctx.sender());
  }

  // 签到
  public fun check_in (
    member: &mut MemberNft,
    join_activity_nft: &mut JoinActivityNft,
    activity: &mut Activity,
    ctx: &mut TxContext,
  ) {
    // 判断会员是否参与了当前活动
    assert!(activity.join_memeber.contains(&ctx.sender()), ErrorMemberNotJoinActivity);
    // 判断nft是否属于当前活动
    assert!(join_activity_nft.activity_id == object::uid_to_inner(&activity.id), ErrorNftNotMatchActivity);

    // 签到
    join_activity_nft.check_in = true;
    // 增加积分
    add_point(member, 1);
    // 签到事件
    event::emit(CheckInEvent {
      activity_id: object::uid_to_inner(&activity.id),
      join_activity_nft_id: object::uid_to_inner(&join_activity_nft.id),
    });
  }

  // 评分
  public fun score (
    _: &JoinActivityNft,
    member: &mut MemberNft,
    activity: &mut Activity,
    score: u8,
    ctx: &mut TxContext,
  ) {
    // 判断是否参加了当前活动
    assert!(activity.join_memeber.contains(&ctx.sender()), ErrorMemberNotJoinActivity);
    // 判断是否已经评分
    assert!(!activity.comments.contains(ctx.sender()), ErrorAlreadyScore);
    // 判断评分是否大于5
    assert!(score <= 5, ErrorScoreInvalid);

    // 添加评分
    activity.comments.add(ctx.sender(), score);
    // 计算评分
    activity.score = activity.score + score;
    // 增加积分
    add_point(member, 1);

    // 评分事件
    event::emit(ScoreEvent {
      activity_id: object::uid_to_inner(&activity.id),
      score,
    });
  }

  // 活动方提现
  #[allow(lint(self_transfer))]
  public fun withdraw (
    _: &AdminCap,
    sui_hai_server: &mut SuiHaiServer,
    activity: &mut Activity,
    ctx: &mut TxContext,
  ) {
    // 分割活动钱
    let activity_price_value = balance::value(&activity.total_price);
    let activity_fee = get_activity_fee(sui_hai_server);
    let activity_fee_value = activity_price_value / activity_fee;
    // 分割手续费余额
    let activity_fee_balance = balance::split(&mut activity.total_price, activity_fee_value);
    // 手续费充入服务器池子
    join_activity_fee(sui_hai_server, activity_fee_balance);

    // 提现余额
    let withdraw_value = activity_price_value - activity_fee_value;
    let withdraw_balance = balance::split(&mut activity.total_price, withdraw_value);
    let withdraw_coin = from_balance(withdraw_balance, ctx);
    transfer::public_transfer(withdraw_coin, tx_context::sender(ctx));
  }
}
