'use server'

import {getFullnodeUrl, SuiClient} from "@mysten/sui/client";
import {Transaction} from "@mysten/sui/transactions";
import {Ed25519Keypair} from "@mysten/sui/keypairs/ed25519";
import CryptoJS from "crypto-js";

type Network = "mainnet" | "testnet";

const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

function hmacSHA256(pwd: string) {
    const hash = CryptoJS.HmacSHA256(pwd, process.env.SHA_KEY!);
    return hash.toString(CryptoJS.enc.Hex);
}

export async function bind(packageID: string, publisher: string, userTable: string, addr: string, name: string, pwd: string) {
    const rpcUrl = getFullnodeUrl(network);
    const client = new SuiClient({ url: rpcUrl });
    const tx = new Transaction();
    const keypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!);
    tx.moveCall({
        package: packageID,
        module: "user_info",
        function: "bind",
        arguments: [
            tx.object(publisher),
            tx.object(userTable),
            tx.pure.address(addr),
            tx.pure.string(name),
            tx.pure.string(hmacSHA256(pwd))
        ]
    });
    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true
        }
    });
    await client.waitForTransaction({
        digest: result.digest
    });
    return result.effects?.status.status;
}

export async function rebind(packageID: string, publisher: string, userTable: string, addr: string, name: string, pwd: string, newPwd: string) {
    const rpcUrl = getFullnodeUrl(network);
    const client = new SuiClient({ url: rpcUrl });
    const tx = new Transaction();
    const keypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!);
    tx.moveCall({
        package: packageID,
        module: "user_info",
        function: "rebind",
        arguments: [
            tx.object(publisher),
            tx.object(userTable),
            tx.pure.address(addr),
            tx.pure.string(name),
            tx.pure.string(hmacSHA256(pwd)),
            tx.pure.string(hmacSHA256(newPwd))
        ]
    });

    const devResult = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: keypair.toSuiAddress()
    });
    if (devResult.effects.status.status !== "success")
        return "dev run failure";

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true
        }
    });
    await client.waitForTransaction({
        digest: result.digest
    });
    return result.effects?.status.status;
}