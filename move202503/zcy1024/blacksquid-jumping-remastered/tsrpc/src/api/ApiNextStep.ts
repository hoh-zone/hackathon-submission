import {ApiCall} from "tsrpc";
import {ReqNextStep, ResNextStep} from "../shared/protocols/PtlNextStep";
import {Transaction} from "@mysten/sui/transactions";
import {keypair, network, networkConfig, suiClient} from "../config/networkConfig";

export default async function (call: ApiCall<ReqNextStep, ResNextStep>) {
    const tx = new Transaction();
    if (call.req.hashKey.length > 3) {
        tx.moveCall({
            package: networkConfig[network].variables.Jumping.PackageID,
            module: "data",
            function: "next_step",
            arguments: [
                tx.object(networkConfig[network].variables.Jumping.Publisher),
                tx.object(networkConfig[network].variables.Jumping.DataPool),
                tx.pure.id(call.req.nftID),
                tx.pure.string(call.req.hashKey),
                tx.pure.u8(Number(call.req.userPos)),
                tx.object("0x8"),
                tx.pure.address(call.req.receipt)
            ]
        });
    } else {
        tx.moveCall({
            package: networkConfig[network].variables.Jumping.PackageID,
            module: "data",
            function: "endless_next_step",
            arguments: [
                tx.object(networkConfig[network].variables.Jumping.Publisher),
                tx.object(networkConfig[network].variables.Jumping.DataPool),
                tx.pure.id(call.req.nftID),
                tx.object(networkConfig[network].variables.Jumping.EndlessGame),
                tx.pure.u8(Number(call.req.hashKey)),
                tx.pure.u8(Number(call.req.userPos)),
                tx.object("0x8"),
                tx.pure.address(call.req.receipt)
            ]
        });
    }

    const dry = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: keypair.toSuiAddress()
    });
    if (dry.effects.status.status === "failure") {
        await call.error("Error to Jump!");
        return;
    }

    const res = await suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showEvents: true
        }
    });
    await suiClient.waitForTransaction({digest: res.digest});
    await call.succ({
        safePos: res.events && res.events.length > 0 ? (res.events[0].parsedJson as unknown as {
            safe_pos: number
        }).safe_pos : -2
    });
}