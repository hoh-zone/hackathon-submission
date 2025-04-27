module core::csui {
    use std::ascii;
    use sui::coin;
    use sui::url;

    const URL: vector<u8> = b"https://cro-ag.pages.dev/csui.png";

    public struct CSUI has drop { }

    public struct CSUITreasuryCoinfig has key, store {
        id: object::UID,
        treasuryCap: coin::TreasuryCap<CSUI>, 
    }
    
    public(package) fun mint_csui(
        cSUITreasuryCoinfig: &mut CSUITreasuryCoinfig, 
        amount: u64, 
        ctx: &mut tx_context::TxContext
    ): coin::Coin<CSUI> {
        coin::mint<CSUI>(&mut cSUITreasuryCoinfig.treasuryCap, amount, ctx)
    }

    public(package) fun burn_csui(
        cSUITreasuryCoinfig: &mut CSUITreasuryCoinfig,
        coin: coin::Coin<CSUI>
    ) {
        coin::burn<CSUI>(&mut cSUITreasuryCoinfig.treasuryCap, coin);
    }
    
    fun init(witness: CSUI, ctx: &mut tx_context::TxContext) {
        let (treasuryCap, coinMetadata) = coin::create_currency<CSUI>(
            witness, 
            9, 
            b"cSUI", 
            b"cSUI", 
            b"cSUI is a staking token of SUI", 
            option::some<url::Url>(url::new_unsafe(ascii::string(URL))), 
            ctx
        );
        transfer::public_freeze_object<coin::CoinMetadata<CSUI>>(coinMetadata);
        let cSUITreasuryCoinfig = CSUITreasuryCoinfig{
            id: object::new(ctx), 
            treasuryCap: treasuryCap,
        };
        transfer::public_share_object<CSUITreasuryCoinfig>(cSUITreasuryCoinfig);
    }
}
