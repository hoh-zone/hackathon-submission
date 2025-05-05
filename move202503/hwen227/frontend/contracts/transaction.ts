import { SuiInputVotePool } from "@/types"
import { Transaction } from "@mysten/sui/transactions"
import { networkConfig } from "."

export const createVotePoolTx = (votepool: SuiInputVotePool): Transaction => {

    if (!(votepool.details instanceof Uint8Array) || !votepool.allowlist_Id) {
        throw new Error("Invalid vote pool data");
    }
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "shadowvote",
        function: "create_vote_pool_entry",
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.vector('u8', votepool.details),
            tx.object(votepool.allowlist_Id),
            tx.pure.string(votepool.title),
            tx.pure.u64(votepool.start),
            tx.pure.u64(votepool.end),
        ]
    })

    return tx;
}

export const createVotePoolTx_woal = (votepool: SuiInputVotePool): Transaction => {

    if (typeof votepool.details !== 'string') {
        throw new Error("Invalid vote pool data");
    }
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "votepool_wo_al",
        function: "create_vote_pool_entry",
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.string(votepool.details),
            tx.pure.string(votepool.title),
            tx.pure.u64(votepool.start),
            tx.pure.u64(votepool.end),
        ]
    })

    return tx;
}

export const createAllowlisTx = async (name: string) => {
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "allowlist",
        function: "create_allowlist_entry",
        arguments: [
            tx.pure.string(name)
        ]
    });

    return tx;
}

export const allowListAdd = async (tx: Transaction, allowlistId: string, allowlistCap: string, address: string) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::add`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.address(address),
        ]
    })

    return tx;
}

export const allowListRemove = async (tx: Transaction, allowlistId: string, allowlistCap: string, address: string) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::remove`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.address(address),
        ]
    })

    return tx;
}
export const allowlistMultiAdd = async (tx: Transaction, allowlistId: string, allowlistCap: string, addresses: string[]) => {
    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::batch_add`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.vector('address', addresses)
        ]
    }
    );
    return tx;
}

export const allowListMultiRemove = async (tx: Transaction, allowlistId: string, allowlistCap: string, addresses: string[]) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::batch_remove`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.vector('address', addresses)
        ]
    })

    return tx;
}

export const castVoteTx = async (votePoolId: string, votebox: string, vote: Uint8Array) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::shadowvote::cast_vote`,
        arguments: [
            tx.object(votePoolId),
            tx.object(votebox),
            tx.pure.vector('u8', vote),
            tx.object("0x6"),
        ]
    })

    return tx;
}

export const castVoteTx_woal = async (votePoolId: string, votebox: string, vote: Uint8Array) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::votepool_wo_al::cast_vote`,
        arguments: [
            tx.object(votePoolId),
            tx.object(votebox),
            tx.pure.vector('u8', vote),
            tx.object("0x6"),
        ]
    })

    return tx;
}


