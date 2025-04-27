module ffd::nft;

use std::string::String;
use sui::display;
use sui::dynamic_object_field;
use sui::package;

public struct NFT has drop {}

public struct FightForDoveNFT has key, store {
    id: UID,
    name: String,
    image_url: String
}

fun init(otw: NFT, ctx: &mut TxContext) {
    let keys = vector[
        b"name".to_string(),
        b"link".to_string(),
        b"image_url".to_string(),
        b"description".to_string(),
        b"project_url".to_string(),
        b"creator".to_string(),
    ];
    let values = vector[
        b"{name}".to_string(),
        b"https://github.com/zcy1024/fight-for-dove".to_string(),
        b"{image_url}".to_string(),
        b"Good Luck! Have Fun!".to_string(),
        b"https://github.com/zcy1024/fight-for-dove".to_string(),
        b"Debirth".to_string(),
    ];
    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<FightForDoveNFT>(&publisher, keys, values, ctx);
    display.update_version();
    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

public fun mint(ctx: &mut TxContext): FightForDoveNFT {
    FightForDoveNFT {
        id: object::new(ctx),
        name: b"FightForDoveNFT".to_string(),
        image_url: b"https://mainnet-aggregator.hoh.zone/v1/blobs/nckOW-KyZP-VKlYKmIZcp4D6EuisThEbse2qUCWQPpY".to_string(),
    }
}

#[allow(lint(self_transfer))]
public fun mint_and_keep(ctx: &mut TxContext) {
    transfer::public_transfer(mint(ctx), ctx.sender());
}

public fun burn(nft: FightForDoveNFT) {
    let FightForDoveNFT {
        id,
        name: _,
        image_url: _
    } = nft;
    id.delete();
}

public fun add_props<T: key + store>(nft: &mut FightForDoveNFT, props: T) {
    let props_id = object::id(&props);
    dynamic_object_field::add<ID, T>(&mut nft.id, props_id, props);
}

public fun remove_props<T: key + store>(nft: &mut FightForDoveNFT, id: ID): T {
    dynamic_object_field::remove<ID, T>(&mut nft.id, id)
}