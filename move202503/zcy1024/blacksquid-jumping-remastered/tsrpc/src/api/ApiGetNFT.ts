import { ApiCall } from "tsrpc";
import { ReqGetNFT, ResGetNFT } from "../shared/protocols/PtlGetNFT";
import {network, networkConfig, suiClient} from "../config/networkConfig";

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

export default async function (call: ApiCall<ReqGetNFT, ResGetNFT>) {
    const nftID = await getNFTID(call.req.address, null);
    await call.succ({
        nftID: nftID ? nftID : ""
    })
}