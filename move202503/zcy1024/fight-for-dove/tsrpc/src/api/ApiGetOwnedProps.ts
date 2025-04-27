import { ApiCall } from "tsrpc";
import { ReqGetOwnedProps, ResGetOwnedProps } from "../shared/protocols/PtlGetOwnedProps";
import {network, networkConfig, suiClient} from "../config/networkConfig";
import {PropsType} from "../shared/protocols/PtlGetGameInfo";

export async function getFFDNFTID(owner: string, cursor: string | null | undefined): Promise<string> {
    const data = await suiClient.getOwnedObjects({
        owner,
        cursor,
        options: {
            showType: true
        }
    });
    const found = data.data.find(item => item.data?.type === `${networkConfig[network].variables.FFD.PackageID}::nft::FightForDoveNFT`);
    return found ? found.data!.objectId : (data.hasNextPage ? await getFFDNFTID(owner, data.nextCursor) : "");
}

async function getOwnedProps(parentId: string, cursor: string | null | undefined): Promise<PropsType[]> {
    const data = await suiClient.getDynamicFields({
        parentId,
        cursor
    });
    const props: PropsType[] = [];
    for (let i = 0; i < data.data.length; i++) {
        props.push((await suiClient.getObject({
            id: data.data[i].objectId,
            options: {
                showContent: true
            }
        })).data?.content as unknown as PropsType);
    }
    if (data.hasNextPage)
        return props.concat(await getOwnedProps(parentId, data.nextCursor));
    return props;
}

export default async function (call: ApiCall<ReqGetOwnedProps, ResGetOwnedProps>) {
    const nft = await getFFDNFTID(call.req.owner, null);
    console.log(nft);
    if (!nft)
        await call.succ({
            props: []
        });
    await call.succ({
        props: await getOwnedProps(nft, null)
    });
}