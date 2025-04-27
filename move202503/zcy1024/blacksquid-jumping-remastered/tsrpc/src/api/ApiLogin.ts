import {ApiCall} from "tsrpc";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import {ReqLogin, ResLogin} from "../shared/protocols/PtlLogin";
import {keypair, network, networkConfig, suiClient} from "../config/networkConfig";
import {Transaction} from "@mysten/sui/transactions";

dotenv.config();

function hmacSHA256(pwd: string) {
    const hash = CryptoJS.HmacSHA256(pwd, process.env.SHA_KEY!);
    return hash.toString(CryptoJS.enc.Hex);
}

async function checkInMove(username: string, password: string, address: string) {
    const tx = new Transaction();
    tx.moveCall({
        package: networkConfig[network].variables.GP.PackageID,
        module: "user_info",
        function: "rebind",
        arguments: [
            tx.object(networkConfig[network].variables.GP.Publisher),
            tx.object(networkConfig[network].variables.GP.UserTable),
            tx.pure.address(address),
            tx.pure.string(username),
            tx.pure.string(hmacSHA256(password)),
            tx.pure.string(hmacSHA256(password + "devtest"))
        ]
    });
    const devResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: keypair.toSuiAddress()
    });
    return devResult.effects.status.status;
}

export default async function (call: ApiCall<ReqLogin, ResLogin>) {
    await call.succ({
        state: await checkInMove(call.req.username, call.req.password, call.req.address)
    });
}