import { ApiCall } from "tsrpc";
import {FFDataType, ReqGetGameInfo, ResGetGameInfo, UserInfoType} from "../shared/protocols/PtlGetGameInfo";
import {network, networkConfig, suiClient} from "../config/networkConfig";

async function getGameInfoInTable(parentId: string, cursor: string | null | undefined, user: string): Promise<UserInfoType> {
    const data = await suiClient.getDynamicFields({
        parentId,
        cursor
    });
    const found = data.data.find(data => data.name.value as string === user);
    if (!found)
        return data.hasNextPage ? await getGameInfoInTable(parentId, data.nextCursor, user) : {
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

export default async function (call: ApiCall<ReqGetGameInfo, ResGetGameInfo>) {
    if (!call.req.user)
        await call.succ({
            info: {
                fields: {
                    value: {
                        fields: {
                            game_state: "Ready",
                            can_new_game_amount: "0",
                            in_game_props: []
                        }
                    }
                }
            }
        });
    const data = await suiClient.getObject({
        id: networkConfig[network].variables.FFD.Data,
        options: {
            showContent: true
        }
    });
    await call.succ({
        info: await getGameInfoInTable((data.data?.content as unknown as FFDataType).fields.users.fields.id.id, null, call.req.user!)
    });
}