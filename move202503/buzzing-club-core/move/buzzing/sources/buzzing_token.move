module buzzing::buzzing_token;

use sui::coin::{Self};
use sui::balance::{Self};

// platform token
public struct BUZZING_TOKEN has drop {}

public struct Valt has key,store {
    id: UID,
    balance: balance::Balance<BUZZING_TOKEN>,
}

fun init(witness: BUZZING_TOKEN, ctx: &mut TxContext) {
    let (mut treasury, metadata) = coin::create_currency(
        witness,
        6,
        // name
        b"BUZZING_TOKEN",
        // symbol
        b"BUZZING_TOKEN",
        // description
        b"Buzzing Token",
        // icon url 
        option::none(),
        ctx,
	);
    // mint 1_000_000_000 platform token to sender

    transfer::public_transfer(coin::mint(&mut treasury, 10000 * 1_000_000, ctx), ctx.sender());
    let mycoin = coin::mint(&mut treasury, 1_000_000_000 * 1_000_000, ctx);
    let mycoin_balance = coin::into_balance(mycoin);

    let valt = Valt {
        id: object::new(ctx),
        balance: mycoin_balance,
    };

    transfer::public_share_object(valt);

    transfer::public_freeze_object(metadata);
	transfer::public_freeze_object(treasury);
}

public entry fun faucet(valt:&mut Valt, amount:u64, ctx: &mut TxContext) {
    let mycoin = valt.balance.split(amount);
    let mycoin_balance = coin::from_balance(mycoin, ctx);
    transfer::public_transfer(mycoin_balance, ctx.sender());
}