module game_park::admin;

use sui::package;

public struct ADMIN has drop {}

fun init(otw: ADMIN, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);
}