'use client'

import {network, networkConfig, suiClient} from "@/configs/networkConfig";
import {DynamicFieldInfo} from "@mysten/sui/client";
import {GameInfoType, getGameInfoByNFTID} from "@/libs/contracts";

type GPCapType = {
    fields: {
        kiosk: {
            fields: {
                id: {
                    id: string
                }
            }
        }
    }
}

type ListingType = {
    fields: {
        value: {
            fields: {
                price: string,
                receipt: string
            }
        }
    }
}

export async function getParentID(GPCapID: string) {
    const data = await suiClient.getObject({
        id: GPCapID,
        options: {
            showContent: true
        }
    });
    return (data.data?.content as unknown as GPCapType).fields.kiosk.fields.id.id;
}

export async function getGameInfo(id: string, cursor: string | null | undefined): Promise<DynamicFieldInfo[]> {
    const data = await suiClient.getDynamicFields({
        parentId: id,
        cursor
    });
    const dynamicFields = data.data.filter(data => data.type === "DynamicField");
    if (data.hasNextPage) {
        const nextFields = await getGameInfo(id, data.nextCursor);
        return dynamicFields.concat(nextFields);
    }
    return dynamicFields;
}

export async function getListing(id: string): Promise<[string, string]> {
    const data = await suiClient.getObject({
        id: id,
        options: {
            showContent: true
        }
    });
    const listing = data.data?.content as unknown as ListingType;
    return [listing.fields.value.fields.price, listing.fields.value.fields.receipt];
}

async function combinedData(fields: DynamicFieldInfo[]) {
    const gameInfos: GameInfoType[] = [];
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const objectID = field.name.value as string;
        const [price, owner] = await getListing(field.objectId);
        const gameInfo = await getGameInfoByNFTID(owner, objectID, price);
        if (gameInfo)
            gameInfos.push(gameInfo);
    }
    return gameInfos;
}

export async function getJumpingNFTInMarket() {
    const parentID = await getParentID(networkConfig[network].variables.Kiosk.GameParkKioskCap);
    const dynamicFields = await getGameInfo(parentID, null);
    return await combinedData(dynamicFields);
}