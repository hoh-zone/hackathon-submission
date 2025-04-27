'use client'

import {createBetterTxFactory, network, networkConfig, suiClient} from "@/configs/networkConfig";
import {coinWithBalance} from "@mysten/sui/transactions";

export async function getGP(owner: string | undefined) {
    if (!owner)
        return "0";
    return (await suiClient.getBalance({
        owner,
        coinType: `${networkConfig[network].variables.GP.PackageID}::gp::GP`
    })).totalBalance;
}

type FFDataType = {
    fields: {
        users: {
            fields: {
                id: {
                    id: string
                }
            }
        }
    }
}

export type PropsType = {
    fields: {
        id: {
            id: string
        },
        props_type: string,
        quality: string,
        image_url: string,
        effects: {
            fields: {
                contents: {
                    fields: {
                        key: string,
                        value: string
                    }
                }[]
            }
        }
    }
}

type UserInfoType = {
    fields: {
        value: {
            fields: {
                game_state: string,
                can_new_game_amount: string,
                in_game_props: PropsType[]
            }
        }
    }
}

async function getGameCountInTable(parentId: string, cursor: string | null | undefined, user: string): Promise<UserInfoType> {
    const data = await suiClient.getDynamicFields({
        parentId,
        cursor
    });
    const found = data.data.find(data => data.name.value as string === user);
    if (!found)
        return data.hasNextPage ? await getGameCountInTable(parentId, data.nextCursor, user) : {
            fields: {
                value: {
                    fields: {
                        game_state: "Ready",
                        can_new_game_amount: "0",
                        in_game_props: []
                    }
                }
            }
        };
    const info = await suiClient.getObject({
        id: found.objectId,
        options: {
            showContent: true
        }
    });
    return info.data?.content as unknown as UserInfoType;
}

export async function getGameCount(user: string | undefined) {
    if (!user)
        return {
            fields: {
                value: {
                    fields: {
                        game_state: "Ready",
                        can_new_game_amount: "0",
                        in_game_props: []
                    }
                }
            }
        };
    const data = await suiClient.getObject({
        id: networkConfig[network].variables.FFD.Data,
        options: {
            showContent: true
        }
    });
    return await getGameCountInTable((data.data?.content as unknown as FFDataType).fields.users.fields.id.id, null, user);
}

export const buyGameCountTx = createBetterTxFactory<{
    sender: string,
    count: number,
    nftID: string | null | undefined
}>((tx, networkVariables, params) => {
    tx.setSender(params.sender);
    if (!params.nftID) {
        tx.moveCall({
            package: networkVariables.FFD.PackageID,
            module: "nft",
            function: "mint_and_keep"
        });
    }
    tx.moveCall({
        package: networkVariables.FFD.PackageID,
        module: "data",
        function: "buy_game_amount",
        arguments: [
            tx.object(networkVariables.FFD.Data),
            coinWithBalance({
                balance: params.count * 10,
                type: `${networkVariables.GP.PackageID}::gp::GP`
            }),
            tx.object(networkVariables.GP.GPTreasuryCap),
            tx.object(networkVariables.GP.Pool)
        ]
    });
    return tx;
});

export async function getNFTID(owner: string | null | undefined, cursor: string | null | undefined): Promise<string | null | undefined> {
    if (!owner)
        return undefined;
    const data = await suiClient.getOwnedObjects({
        owner,
        cursor,
        options: {
            showType: true
        }
    });
    const found = data.data.find(data => data.data?.type === `${networkConfig[network].variables.FFD.PackageID}::nft::FightForDoveNFT`);
    return found ? found.data?.objectId : (data.hasNextPage ? await getNFTID(owner, data.nextCursor) : undefined);
}

export const dropToNewGameTx = createBetterTxFactory<{
    nft: string,
    ids: string[]
}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.FFD.PackageID,
        module: "data",
        function: "ready_new_game",
        arguments: [
            tx.object(networkVariables.FFD.Data),
            tx.object(params.nft),
            tx.pure.vector("id", params.ids)
        ]
    });
    return tx;
});