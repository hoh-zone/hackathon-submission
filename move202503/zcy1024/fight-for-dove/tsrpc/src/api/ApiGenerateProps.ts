import { ApiCall } from "tsrpc";
import { ReqGenerateProps, ResGenerateProps } from "../shared/protocols/PtlGenerateProps";
import {Transaction} from "@mysten/sui/transactions";
import {keypair, network, networkConfig, suiClient} from "../config/networkConfig";

export default async function (call: ApiCall<ReqGenerateProps, ResGenerateProps>) {
    const tx = new Transaction();
    tx.moveCall({
        package: networkConfig[network].variables.FFD.PackageID,
        module: "data",
        function: "generate_in_game_props",
        arguments: [
            tx.object(networkConfig[network].variables.FFD.Publisher),
            tx.object(networkConfig[network].variables.FFD.Data),
            tx.pure.address(call.req.user),
            tx.object(networkConfig[network].variables.FFD.PropsList),
            tx.object("0x8")
        ]
    });
    const res = await suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true
        }
    });
    await suiClient.waitForTransaction({
        digest: res.digest
    });
    await call.succ({
        success: res.effects?.status.status === "success"
    });
}