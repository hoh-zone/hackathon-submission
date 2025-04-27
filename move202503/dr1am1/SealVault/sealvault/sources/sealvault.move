module sealvault::sealvault {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// Represents an NFT associated with a specific file, storing the Walrus file's blob_id.
    public struct FileAccessNFT has key {
        id: UID,
        blob_id: vector<u8>,
    }

    /// Error code: Access denied.
    const EAccessDenied: u64 = 0;

    /// Mints a new FileAccessNFT, records the blob_id, and transfers it to the caller.
    public entry fun mint_nft(blob_id: vector<u8>, ctx: &mut TxContext) {
        let nft = FileAccessNFT {
            id: object::new(ctx),
            blob_id,
        };
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    /// Access control function for Seal, checks if the provided NFT matches the blob_id.
    public entry fun seal_approve(nft: &FileAccessNFT, blob_id: vector<u8>) {
        assert!(nft.blob_id == blob_id, EAccessDenied);
    }
}