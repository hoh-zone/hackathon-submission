module game_park_kiosk::kiosk;

use std::ascii::String;
use std::u64;
use std::type_name;
use sui::coin::Coin;
use sui::dynamic_field;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::package::{Self, Publisher};
use game_park::gp::{GP, GPTreasuryCap, Pool};

// error code
const E_Already_Exist: u64 = 0;
const E_Not_Exist: u64 = 1;
const E_Not_Accepted_Item_Type: u64 = 2;
const E_Not_Min_Price: u64 = 3;
const E_Not_Enough_GP: u64 = 4;

public struct KIOSK has drop {}

public struct GameParkKioskCap has key {
    id: UID,
    kiosk: Kiosk,
    kioskOwnerCap: KioskOwnerCap,
    acceptedTypes: vector<String>
}

public struct Listing has store, copy, drop {
    price: u64,
    receipt: address
}

fun init(otw: KIOSK, ctx: &mut TxContext) {
    // Publisher
    package::claim_and_keep(otw, ctx);
    // GameParkKioskCap
    let (mut kiosk, kioskOwnerCap) = kiosk::new(ctx);
    kiosk.set_allow_extensions(&kioskOwnerCap, true);
    transfer::share_object(GameParkKioskCap {
        id: object::new(ctx),
        kiosk,
        kioskOwnerCap,
        acceptedTypes: vector<String>[]
    });
}

entry fun add_type(_: &Publisher, cap: &mut GameParkKioskCap, new_type: String) {
    assert!(!cap.acceptedTypes.contains(&new_type), E_Already_Exist);
    cap.acceptedTypes.push_back(new_type);
}

entry fun remove_type(_: &Publisher, cap: &mut GameParkKioskCap, old_type: String) {
    let (found, idx) = cap.acceptedTypes.index_of(&old_type);
    assert!(found, E_Not_Exist);
    cap.acceptedTypes.remove(idx);
}

public fun place<T: key + store>(cap: &mut GameParkKioskCap, item: T, price: u64, ctx: &TxContext) {
    let item_id = object::id(&item);
    let item_type = type_name::get<T>().into_string();
    assert!(cap.acceptedTypes.contains(&item_type), E_Not_Accepted_Item_Type);
    assert!(price > 0, E_Not_Min_Price);
    cap.kiosk.place(&cap.kioskOwnerCap, item);
    dynamic_field::add(cap.kiosk.uid_mut(), item_id, Listing {
        price,
        receipt: ctx.sender()
    });
}

public fun purchase<T: key + store>(cap: &mut GameParkKioskCap, id: ID, mut gp: Coin<GP>, treasury: &mut GPTreasuryCap, pool: &mut Pool, ctx: &mut TxContext) {
    // remove dynamic field
    let Listing {
        price,
        receipt
    } = dynamic_field::remove<ID, Listing>(cap.kiosk.uid_mut(), id);

    // consume fee
    assert!(price == gp.value(), E_Not_Enough_GP);
    let consume_amount = u64::max(gp.value() / 100, 1);
    treasury.consume(pool, gp.split(consume_amount, ctx));
    // transfer gp to seller
    if (gp.value() == 0) {
        gp.destroy_zero();
    } else {
        transfer::public_transfer(gp, receipt);
    };

    // take item
    transfer::public_transfer(cap.kiosk.take<T>(&cap.kioskOwnerCap, id), ctx.sender());
}

public fun purchase_to_use<T: key + store>(cap: &mut GameParkKioskCap, id: ID, mut gp: Coin<GP>, treasury: &mut GPTreasuryCap, pool: &mut Pool, ctx: &mut TxContext): T {
    // remove dynamic field
    let Listing {
        price,
        receipt
    } = dynamic_field::remove<ID, Listing>(cap.kiosk.uid_mut(), id);

    // consume fee
    assert!(price == gp.value(), E_Not_Enough_GP);
    let consume_amount = u64::max(gp.value() / 100, 1);
    treasury.consume(pool, gp.split(consume_amount, ctx));
    // transfer gp to seller
    if (gp.value() == 0) {
        gp.destroy_zero();
    } else {
        transfer::public_transfer(gp, receipt);
    };

    // take item and return it
    cap.kiosk.take<T>(&cap.kioskOwnerCap, id)
}