module points::points {
    use std::ascii;
    use sui::coin;
    use sui::url;

    const TOTAL_SUPPLY: u64 = 10000000000;

    const URL: vector<u8> = b"https://cro-ag.pages.dev/points.png";

    public struct POINTS has drop { }
    
    public fun mint_points(
        treasuryCap: &mut coin::TreasuryCap<POINTS>, 
        amount: u64,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<POINTS> {
        coin::mint<POINTS>(treasuryCap, amount, ctx)
    }

    public fun burn_points(treasuryCap: &mut coin::TreasuryCap<POINTS>, coin: coin::Coin<POINTS>) {
        coin::burn<POINTS>(treasuryCap, coin);
    }
    
    fun init(witness: POINTS, ctx: &mut tx_context::TxContext) {
        let (treasuryCap, coinMetadata) = coin::create_currency<POINTS>(
            witness, 
            0, 
            b"POINTS", 
            b"CROCODILE PROTOCOL POINTS", 
            b"crocodile protocol points token", 
            option::some<url::Url>(url::new_unsafe(ascii::string(URL))), 
            ctx
        );
        transfer::public_freeze_object<coin::CoinMetadata<POINTS>>(coinMetadata);
        let mut treasuryCap_ref = treasuryCap;
        transfer::public_transfer<coin::Coin<POINTS>>(coin::mint<POINTS>(&mut treasuryCap_ref, TOTAL_SUPPLY, ctx), tx_context::sender(ctx));
        transfer::public_transfer<coin::TreasuryCap<POINTS>>(treasuryCap_ref, tx_context::sender(ctx));
    }
}
