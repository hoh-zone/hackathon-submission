#[test_only]
module card::game_tests;
 use card::card::{Self,Vault};
use sui::test_scenario::{Self, Scenario, next_tx, ctx};
 use sui::coin::{Self};
     use sui::sui::{SUI};
     use std::debug::print;

const ADMIN: address = @0x1;
const USER0: address = @0x10;

const USER1: address = @0x2;
const USER2: address = @0x3;
const USER3: address = @0x4;
const USER4: address = @0x5;
const USER5: address = @0x6;

fun init_room(scenario: &mut Scenario) {

    next_tx(scenario, ADMIN);
    {
        card::init_for_testing(ctx(scenario));
    };
}

#[test]
fun test_member_initialization() {
    let mut scenario = test_scenario::begin(ADMIN);
    // 初始化会员系统
    init_room(&mut scenario);
    // 验证会员系统已创建
    next_tx(&mut scenario, ADMIN);
    {
        assert!(test_scenario::has_most_recent_shared<Vault>(), 0);
    };
    test_scenario::end(scenario);
}

#[test]
    fun test_basic_match_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
                test_member_initialization();
                    next_tx(&mut scenario, ADMIN);
    let mut vault = test_scenario::take_shared<Vault>(&scenario);
next_tx(&mut scenario, USER0);

  {  // 测试用例1：玩家1创建房间
card::submit(10,&mut vault, ctx(&mut scenario));
        // 验证房间创建

};


                        next_tx(&mut scenario, USER1);

  {  // 测试用例1：玩家1创建房间
            let  wallet1 = coin::mint_for_testing<SUI>(100_000_000_000, ctx(&mut scenario));
card::payment(wallet1,&mut vault, ctx(&mut scenario));
card::submit(10,&mut vault, ctx(&mut scenario));
        // 验证房间创建

};
  next_tx(&mut scenario, USER2);

  {  // 测试用例2：玩家2创建房间
            let  wallet2 = coin::mint_for_testing<SUI>(500_000_000, ctx(&mut scenario));
card::payment(wallet2,&mut vault, ctx(&mut scenario));
card::submit(20,&mut vault, ctx(&mut scenario));
        // 验证房间创建
  

};
  next_tx(&mut scenario, USER3);

  {  // 测试用例1：玩家1创建房间
            let  wallet3 = coin::mint_for_testing<SUI>(500_000_000, ctx(&mut scenario));
card::payment( wallet3,&mut vault, ctx(&mut scenario));
card::submit(30,&mut vault, ctx(&mut scenario));
        // 验证房间创建
     

};
  next_tx(&mut scenario, USER4);

  {  // 测试用例1：玩家1创建房间
            let  wallet4 = coin::mint_for_testing<SUI>(500_000_000, ctx(&mut scenario));
card::payment(wallet4,&mut vault, ctx(&mut scenario));
card::submit(40,&mut vault, ctx(&mut scenario));
        // 验证房间创建
 

};
  next_tx(&mut scenario, USER5);

  {  // 测试用例1：玩家1创建房间
            let  wallet5 = coin::mint_for_testing<SUI>(500_000_000, ctx(&mut scenario));
card::payment(wallet5,&mut vault, ctx(&mut scenario));
card::submit(50,&mut vault, ctx(&mut scenario));
        // 验证房间创建
   
};
test_scenario::return_shared(vault);
        test_scenario::end(scenario);

    }