import { ApiCall } from "tsrpc";
import { ReqGetEndlessGameInfo, ResGetEndlessGameInfo } from "../shared/protocols/PtlGetEndlessGameInfo";
import {network, networkConfig, suiClient} from "../config/networkConfig";

type ContentType = {
    fields: {
        idx: string | number,
        data: {
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

export default async function (call: ApiCall<ReqGetEndlessGameInfo, ResGetEndlessGameInfo>) {
    const data = await suiClient.getObject({
        id: networkConfig[network].variables.Jumping.EndlessGame,
        options: {
            showContent: true
        }
    });
    const content = data.data?.content as unknown as ContentType;
    return await call.succ({
        endlessGameInfo: {
            fields: {
                key: content.fields.idx.toString(),
                value: {
                    fields: {
                        list: content.fields.data.fields.list,
                        row: content.fields.data.fields.row,
                        end: content.fields.data.fields.end,
                        cur_step_paid: content.fields.data.fields.cur_step_paid,
                        final_reward: content.fields.data.fields.final_reward
                    }
                }
            }
        }
    })
}