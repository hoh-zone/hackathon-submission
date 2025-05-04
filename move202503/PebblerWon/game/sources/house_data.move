
module game::house_data {

    use sui::balance::{ Balance};
    use sui::sui::SUI;
    use sui::coin::{Self,Coin};
    use sui::package::{Self};

    const EcallerNoHouse: u64 = 0;
    public struct HouseData has key {
        id: UID,
        balance: Balance<SUI>,
        house: address,
        public_key: vector<u8>,
        max_stake: u64,
        min_stake: u64,

    }

    public struct HouseCap has key {
        id: UID,
    }

    public struct HOUSE_DATA has drop {}

    fun init(otw: HOUSE_DATA,ctx: &mut TxContext){
        package::claim_and_keep(otw, ctx);
        let house_cap = HouseCap{
            id: object::new(ctx)
        };
        transfer::transfer(house_cap, ctx.sender());
    }

    public fun initialize_house_data(house_cap: HouseCap, coin: Coin<SUI>, public_key: vector<u8>,ctx: &mut TxContext){
        assert!(coin.value()>0,0);
        let house_data = HouseData {
            id: object::new(ctx),
            balance: coin.into_balance(),
            house: ctx.sender(),
            public_key,
            max_stake:50_000_000_000, // 50sui
            min_stake:100_000_000,// 0.1sui
        };
        let HouseCap {id} = house_cap;
        object::delete(id);

        transfer::share_object(house_data);
    }

    public fun top_up(house_data: &mut HouseData, coin:Coin<SUI>, _: &mut TxContext){
        coin::put(&mut house_data.balance,coin)
    }

    public fun withdraw(house_data: &mut HouseData, ctx:&mut TxContext){
        assert!(ctx.sender()==house_data.house,EcallerNoHouse);

        let total_balance = house_data.balance.value();
        let coin = coin::take(&mut house_data.balance, total_balance,ctx);

        transfer::public_transfer(coin, house_data.house);
    }

    public fun update_max_stake(house_data: &mut HouseData, max_stake:u64, ctx:&mut TxContext){
        assert!(ctx.sender() == house_data.house,EcallerNoHouse);

        house_data.max_stake = max_stake;
    }

    public fun update_min_stake(house_data: &mut HouseData,min_stake:u64,ctx:&mut TxContext){
        assert!(ctx.sender() == house_data.house,EcallerNoHouse);
        house_data.min_stake = min_stake;
    }

    public fun max_stake(house_data: &HouseData):u64 {
        house_data.max_stake
    }
    public fun min_stake(house_data: &HouseData):u64 {
        house_data.min_stake
    }
    public fun balance(house_data: &HouseData):u64 {
        house_data.balance.value()
    }

    public(package) fun borrow_balance_mut(house_data: &mut HouseData): &mut Balance<SUI>{
        &mut house_data.balance
    }

    public(package) fun borrow_mut(house_data: &mut HouseData): &mut UID {
        &mut house_data.id
    }

    public(package) fun borrow(house_data: & HouseData): & UID {
        &house_data.id
    }
}