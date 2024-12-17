module achievement::achievement;
use std::ascii::String;
use sui::balance::Balance;
use sui::sui::SUI;
use sui::coin;
use sui::transfer::public_transfer;

// 创建某种成就的授予能力
public struct AchievementGrantCap has key,store{
    id:UID,
    desc:String,     // 关于某项成就的说明
    image_url:String // 照片
}

public struct Achievement has key,store{
    id:UID,
    prize:Balance<SUI>,
    owner:address,
    desc:String,     // 关于某项成就的说明
    image_url:String // 照片
}

public  fun balance(achievement: &mut Achievement):u64{
    achievement.prize.value()
}

public entry fun prize_balance(achievement: &mut Achievement,_ctx:&mut TxContext):u64{
    return achievement.balance()
}

public entry fun withdraw(achievement: &mut Achievement, amount: u64, ctx:&mut TxContext){
    assert!(achievement.owner==ctx.sender(),0x1);
    assert!(achievement.prize.value()>=amount,0x2);
    let out_coin = achievement.prize.split(amount);
    let withdraw_coins = coin::from_balance(out_coin,ctx);
    public_transfer(withdraw_coins,ctx.sender())
}

fun init(_ctx:&mut TxContext){

}


public entry fun create_achievement_grant(desc:String,image_url:String,ctx:&mut TxContext){
    let achievement_cap = AchievementGrantCap{
        id:object::new(ctx),
        desc:desc,
        image_url: image_url,
    };
    transfer::public_transfer(achievement_cap,ctx.sender())
}

public entry fun grant_achievement(cap:&AchievementGrantCap,prize:coin::Coin<SUI>, rewardee:address,ctx:&mut TxContext){
    let mut achievement = Achievement{
        id:object::new(ctx),
        prize:sui::balance::zero(),
        owner:rewardee,
        desc: cap.desc,
        image_url:cap.image_url,
    };
    let in_amt = coin::into_balance(prize);
    achievement.prize.join(in_amt);
    transfer::public_transfer(achievement,rewardee);
}
