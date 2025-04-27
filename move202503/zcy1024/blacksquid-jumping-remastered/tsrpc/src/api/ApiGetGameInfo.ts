import { ApiCall } from "tsrpc";
import {GameInfoType, ReqGetGameInfo, ResGetGameInfo} from "../shared/protocols/PtlGetGameInfo";
import {network, networkConfig, suiClient} from "../config/networkConfig";

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
                        contents: GameInfoType[]
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

export default async function (call: ApiCall<ReqGetGameInfo, ResGetGameInfo>) {
    if (!call.req.address || !call.req.nftID) {
        await call.succ({
            gameInfo: []
        });
        return;
    }
    const dataPool = await suiClient.getObject({
        id: networkConfig[network].variables.Jumping.DataPool,
        options: {
            showContent: true
        }
    });
    const userInfoID = await getUserInfoID((dataPool.data?.content as unknown as DataPoolType).fields.pool_table.fields.id.id, null, call.req.nftID);
    if (!userInfoID) {
        await call.succ({
            gameInfo: []
        });
        return;
    }
    const userInfo = await getUserInfo(userInfoID);
    await call.succ({
        gameInfo: userInfo.fields.value.fields.hash_data.fields.contents
    })
}