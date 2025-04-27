import { ApiCall } from "tsrpc";
import { ReqDropAll, ResDropAll } from "../shared/protocols/PtlDropAll";
import {Transaction} from "@mysten/sui/transactions";
import {keypair, network, networkConfig, suiClient} from "../config/networkConfig";

export default async function (call: ApiCall<ReqDropAll, ResDropAll>) {
    const tx = new Transaction();
    tx.moveCall({
        package: networkConfig[network].variables.FFD.PackageID,
        module: "data",
        function: "drop_all_to_new_game",
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