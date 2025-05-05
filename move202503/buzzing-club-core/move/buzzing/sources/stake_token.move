module buzzing::stake_token;

use sui::coin::{Self, TreasuryCap};

public struct STAKE_TOKEN has drop {}

fun init(witness: STAKE_TOKEN, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let (mut treasury, metadata) = coin::create_currency(
        witness,
        6,
        // name
        b"BUZZING_STAKE_TOKEN",
        // symbol
        b"BUZZING_STAKE_TOKEN",
        // description
        b"Stake Token On Buzzing",
        // icon url 
        option::none(),
        ctx,
	);
    // mint 100_000 stake token to sender
    mint(&mut treasury, sender, 100_000 * 1_000_000, ctx);
    transfer::public_freeze_object(metadata);
	transfer::public_transfer(treasury, sender);
}

public entry fun mint(
    treasury_cap: &mut TreasuryCap<STAKE_TOKEN>,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext,
) {
	let coin = coin::mint(treasury_cap, amount, ctx);
	transfer::public_transfer(coin, recipient)
}