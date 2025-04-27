module nft::nft {
    use sui::transfer::transfer; 
    use std::string::{String,utf8};   

 
    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        owner: address,
    }
 
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext 
    ){
    let nft = NFT {
        id: object::new(ctx),
        name:utf8(name),
        description:utf8(description),
        image_url:utf8(image_url),
        owner: tx_context::sender(ctx),
    };
    transfer::transfer(nft, tx_context::sender(ctx)); // 直接将 NFT 转移给调用者
    }

    public entry fun transfer_nft(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        receiver: address,
        ctx: &mut TxContext
        ){
        let nft = NFT{
            id: object::new(ctx),
            name: utf8(name),
            description: utf8(description),
            image_url: utf8(image_url),
            owner: tx_context::sender(ctx),
        };
        transfer(nft, receiver);
    }
}