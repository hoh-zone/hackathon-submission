module jumping::nft;

use std::string::String;
use sui::display;
use sui::package;

public struct NFT has drop {}

public struct BlackSquidJumpingNFT has key, store {
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
        b"https://github.com/zcy1024/blacksquid-jumping-remastered".to_string(),
        b"{image_url}".to_string(),
        b"Good Luck! Have Fun!".to_string(),
        b"https://github.com/zcy1024/blacksquid-jumping-remastered".to_string(),
        b"Debirth".to_string(),
    ];
    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<BlackSquidJumpingNFT>(&publisher, keys, values, ctx);
    display.update_version();
    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

public fun mint(ctx: &mut TxContext): BlackSquidJumpingNFT {
    BlackSquidJumpingNFT {
        id: object::new(ctx),
        name: b"BlackSquidJumpingNFT".to_string(),
        image_url: b"https://mainnet-aggregator.hoh.zone/v1/blobs/rENqmzgtslP-fdRKvIDADRPw1w9oyT-uQQOhJ4M3MgU".to_string(),
    }
}

#[allow(lint(self_transfer))]
public fun mint_and_keep(ctx: &mut TxContext) {
    transfer::public_transfer(mint(ctx), ctx.sender());
}

public(package) fun burn(nft: BlackSquidJumpingNFT) {
    let BlackSquidJumpingNFT {
        id,
        name: _,
        image_url: _
    } = nft;
    id.delete();
}