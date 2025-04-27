// import * as dotenv from "dotenv";
// import {Transaction} from "@mysten/sui/transactions";
// import {Ed25519Keypair} from "@mysten/sui/keypairs/ed25519";
// import {getFullnodeUrl, SuiClient} from "@mysten/sui/client";
//
// dotenv.config();
//
// const Package = "0x0e5a6f507dcd5fb27b8b61a36d5feb29cea3502b80f85e29012ce243c0acdc2a";
// const Publisher = "0x9b695c08eae3d81fd8bea703ca5759b0cf94685528b81da4417461ac01d75b7d";
// const PropsList = "0xd7477c0049a4dbb62f39d24abc0343a5d05e78303c280ea570ed57ac8ed9ff87";
//
// const Quality = 1;
// const Type = "criticalHitRate";
// const Url = "https://mainnet-aggregator.hoh.zone/v1/blobs/73Xx7EzJRALEJVG4slVTSWuwj0ZEs-3TSnSRsOZVAXE";
// const Keys = ["criticalHitRate", "criticalDamage", "attack", "blood"];
// const Values = ["1025", "1010", "1010", "994"];
//
// const suiClient = new SuiClient({url: getFullnodeUrl("testnet")});
// const keypair = Ed25519Keypair.fromSecretKey(process.env.SECRETKEY!);
//
// async function generate() {
//     const tx = new Transaction();
//     tx.moveCall({
//         package: Package,
//         module: "props",
//         function: "generate_new_props",
//         arguments: [
//             tx.object(Publisher),
//             tx.object(PropsList),
//             tx.pure.u8(Quality),
//             tx.pure.string(Type),
//             tx.pure.string(Url)
//         ]
//     });
//     const res = await suiClient.signAndExecuteTransaction({
//         transaction: tx,
//         signer: keypair,
//         options: {
//             showEffects: true,
//             showEvents: true
//         }
//     });
//     await suiClient.waitForTransaction({
//         digest: res.digest
//     });
//     return (res.events?.[0].parsedJson as unknown as {
//         new_props_id: string
//     }).new_props_id;
// }
//
// async function edit(id: string) {
//     const tx = new Transaction();
//     tx.moveCall({
//         package: Package,
//         module: "props",
//         function: "edit_props_effects",
//         arguments: [
//             tx.object(Publisher),
//             tx.object(PropsList),
//             tx.pure.u8(Quality),
//             tx.pure.id(id),
//             tx.pure.vector("string", Keys),
//             tx.pure.vector("string", Values)
//         ]
//     });
//     const res = await suiClient.signAndExecuteTransaction({
//         transaction: tx,
//         signer: keypair,
//         options: {
//             showEffects: true,
//         }
//     });
//     await suiClient.waitForTransaction({
//         digest: res.digest
//     });
//     console.log(`${id} - ${res.effects?.status.status}`);
// }
//
// async function main() {
//     await edit(await generate());
// }
//
// main().then();