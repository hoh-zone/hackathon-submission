'use client'

import {network, networkConfig, suiClient} from "@/configs/networkConfig";

async function getNFTID(owner: string, cursor: string | null | undefined): Promise<string | undefined> {
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

type InnerGameInfoType = {
    fields: {
        key: string,
        value: {
            fields: {
                list: string | number,
                row: string | number,
                end: string | number,
                cur_step_paid: string | number,
                final_reward: string | number
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
                        contents: InnerGameInfoType[]
                    }
                },
                steps: string
            }
        }
    }
}

export type GameInfoType = {
    infos: {
        list: string,
        row: string,
        end: string,
        cur_step_paid: string,
        final_reward: string,
    }[],
    owner: string,
    objectID: string,
    steps: string,
    price?: string
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

export async function getGameInfoByNFTID(owner: string, nftID: string, price?: string) {
    const dataPool = await suiClient.getObject({
        id: networkConfig[network].variables.Jumping.DataPool,
        options: {
            showContent: true
        }
    });
    const userInfoID = await getUserInfoID((dataPool.data?.content as unknown as DataPoolType).fields.pool_table.fields.id.id, null, nftID);
    if (!userInfoID)
        return undefined;
    const userInfo = await getUserInfo(userInfoID);
    const contents = userInfo.fields.value.fields.hash_data.fields.contents;
    const gameInfo: GameInfoType = {
        infos: [],
        owner,
        objectID: nftID,
        steps: userInfo.fields.value.fields.steps,
        price,
    }
    for (let i = 0; i < contents.length; i++) {
        gameInfo.infos.push({
            list: contents[i].fields.value.fields.list.toString(),
            row: contents[i].fields.value.fields.row.toString(),
            end: contents[i].fields.value.fields.end.toString(),
            cur_step_paid: contents[i].fields.value.fields.cur_step_paid.toString(),
            final_reward: contents[i].fields.value.fields.final_reward.toString(),
        })
    }
    return gameInfo;
}

export async function getGameInfo(owner: string) {
    if (!owner)
        return undefined;
    const nftID = await getNFTID(owner, null);
    if (!nftID)
        return undefined;
    return getGameInfoByNFTID(owner, nftID);
}