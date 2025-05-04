#[test_only]
module game::game_tests {
    use sui::hash::{blake2b256};
    use sui::bcs::{Self};
        use sui::test_scenario::{Self, next_tx, ctx};

    // HouseData library
    use std::debug::print;
     #[test]
    public fun test(){
        let addr1 = @0xA;
        let mut scenario = test_scenario::begin(addr1);
        let index:u8 = 10;
        let a = scenario.ctx().digest();
        print(a);
        let mut digest  = bcs::to_bytes(a) ;
        print(&digest);

        let i = bcs::to_bytes(&index);
        print(&i);

        digest.append( i);
        print(&digest);

        let hash = blake2b256(&digest);
        print(&hash);

        let lastDigit = hash[hash.length()-1];

        print(&lastDigit);

        print(&(lastDigit < 12));
        test_scenario::end(scenario);

    }
}