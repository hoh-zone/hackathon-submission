module cro::cro {
    use std::ascii;
    use sui::coin;
    use sui::url;

    const TOTAL_SUPPLY: u64 = 100000000000000;

    const URL: vector<u8> = b"https://cro-ag.pages.dev/cro.png";

    public struct CRO has drop { }
    
    fun init(witness: CRO, ctx: &mut tx_context::TxContext) {
        let (treasuryCap, coinMetadata) = coin::create_currency<CRO>(
            witness, 
            6, 
            b"CRO", 
            b"CROCODILE PROTOCOL", 
            b"crocodile protocol's native token", 
            option::some<url::Url>(url::new_unsafe(ascii::string(URL))), 
            ctx
        );
        transfer::public_freeze_object<coin::CoinMetadata<CRO>>(coinMetadata);
        let mut treasuryCap_ref = treasuryCap;
        transfer::public_transfer<coin::Coin<CRO>>(coin::mint<CRO>(&mut treasuryCap_ref, TOTAL_SUPPLY, ctx), tx_context::sender(ctx));
        transfer::public_transfer<coin::TreasuryCap<CRO>>(treasuryCap_ref, @0x0);
    }
}
