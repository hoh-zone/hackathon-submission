import { ApiCall } from "tsrpc";
import { ReqNextLevel, ResNextLevel } from "../shared/protocols/PtlNextLevel";
import {Transaction} from "@mysten/sui/transactions";
import {keypair, network, networkConfig, suiClient} from "../config/networkConfig";

export default async function (call: ApiCall<ReqNextLevel, ResNextLevel>) {
    const tx = new Transaction();
    tx.moveCall({
        package: networkConfig[network].variables.FFD.PackageID,
        module: "data",
        function: "next_level",
        arguments: [
            tx.object(networkConfig[network].variables.FFD.Publisher),
            tx.object(networkConfig[network].variables.FFD.Data),
            tx.pure.address(call.req.user)
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