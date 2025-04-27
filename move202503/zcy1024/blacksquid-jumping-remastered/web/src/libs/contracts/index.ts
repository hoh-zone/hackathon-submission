'use client'

import {createBetterTxFactory, network, networkConfig, suiClient} from "@/configs/networkConfig";
import {coinWithBalance} from "@mysten/sui/transactions";

export async function getNFTID(owner: string | undefined, cursor: string | null | undefined): Promise<string | undefined> {
    if (!owner)
        return undefined;
    const data = await suiClient.getOwnedObjects({
        owner,
        cursor,
        options: {
            showType: true
        }
    });
    const found = data.data.find(data => data.data?.type === `${networkConfig[network].variables.Jumping.PackageID}::nft::BlackSquidJumpingNFT`);
    return found ? found.data?.objectId : (data.hasNextPage ? await getNFTID(owner, data.nextCursor) : undefined);
}

function randomHashKey(address: string) {
    let key = "";
    for (let i = 0; i < Math.floor(Math.random() * 30) + 30; i++)
        key += address[Math.floor(Math.random() * 60)];
    return key;
}

export const newGameTx = createBetterTxFactory<{
    nftID: string | null | undefined,
    sender: string
}>((tx, networkVariables, params) => {
    tx.setSender(params.sender);
    if (params.nftID) {
        tx.moveCall({
            package: networkVariables.Jumping.PackageID,
            module: "data",
            function: "new_game",
            arguments: [
                tx.object(networkVariables.Jumping.DataPool),
                tx.pure.id(params.nftID),
                tx.pure.string(randomHashKey(params.sender)),
                coinWithBalance({
                    balance: 10,
                    type: `${networkVariables.GP.PackageID}::gp::GP`
                })
            ]
        });
    } else {
        const [nft] = tx.moveCall({
            package: networkVariables.Jumping.PackageID,
            module: "nft",
            function: "mint",
        });
        tx.moveCall({
            package: networkVariables.Jumping.PackageID,
            module: "data",
            function: "new_game_with_nft",
            arguments: [
                tx.object(networkVariables.Jumping.DataPool),
                nft,
                tx.pure.string(randomHashKey(params.sender)),
                coinWithBalance({
                    balance: 10,
                    type: `${networkVariables.GP.PackageID}::gp::GP`
                })
            ]
        });
        tx.transferObjects([nft], params.sender);
    }
    return tx;
});

export async function getGP(owner: string | undefined) {
    if (!owner)
        return "0";
    return (await suiClient.getBalance({
        owner,
        coinType: `${networkConfig[network].variables.GP.PackageID}::gp::GP`
    })).totalBalance;
}

type DataPoolType = {
    fields: {
        pool_table: {
            fields: {
                id: {
                    id: string
                }
            }
        }
    }
}

type UserInfoType = {
    fields: {
        value: {
            fields: {
                hash_data: {
                    fields: {
                        contents: {
                            length: number
                        }
                    }
                },
                steps: string
            }
        }
    }
}

async function getUserInfoID(id: string, cursor: string | null | undefined, nftID: string): Promise<string | undefined> {
    const data = await suiClient.getDynamicFields({
        parentId: id,
        cursor,
    });
    const found = data.data.find(data => (data.name.value as string) === nftID);
    return found ? found.objectId : (data.hasNextPage ? await getUserInfoID(id, data.nextCursor, nftID) : undefined);
}

async function getUserInfo(id: string) {
    const data = await suiClient.getObject({
        id,
        options: {
            showContent: true
        }
    });
    return data.data?.content as unknown as UserInfoType;
}

export async function getStepsAndGames(owner: string | undefined, nftID: string | null | undefined): Promise<[string, number]> {
    if (!owner || !nftID)
        return ["0", !owner ? 3 : 0];
    const dataPool = await suiClient.getObject({
        id: networkConfig[network].variables.Jumping.DataPool,
        options: {
            showContent: true
        }
    });
    const userInfoID = await getUserInfoID((dataPool.data?.content as unknown as DataPoolType).fields.pool_table.fields.id.id, null, nftID);
    if (!userInfoID)
        return ["0", 3];
    const userInfo = await getUserInfo(userInfoID);
    return [userInfo.fields.value.fields.steps, userInfo.fields.value.fields.hash_data.fields.contents.length];
}

export const buyStepsTx = createBetterTxFactory<{
    nftID: string,
    amount: number,
    sender: string
}>((tx, networkVariables, params) => {
    tx.setSender(params.sender);
    tx.moveCall({
        package: networkVariables.Jumping.PackageID,
        module: "data",
        function: "buy_steps",
        arguments: [
            tx.object(networkVariables.Jumping.DataPool),
            tx.pure.id(params.nftID),
            coinWithBalance({
                balance: params.amount,
                type: `${networkVariables.GP.PackageID}::gp::GP`,
            })
        ]
    });
    return tx;
});

export const clearDataTx = createBetterTxFactory<{
    nftID: string
}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Jumping.PackageID,
        module: "data",
        function: "clear_user_info",
        arguments: [
            tx.object(networkVariables.Jumping.DataPool),
            tx.object(params.nftID)
        ]
    });
    return tx;
})