'use client'

import {createBetterTxFactory} from "@/configs/networkConfig";

export const createPlaceNFTTx = createBetterTxFactory<{
    nftID: string,
    price: number
}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Kiosk.PackageID,
        module: "kiosk",
        function: "place",
        typeArguments: [`${networkVariables.Jumping.PackageID}::nft::BlackSquidJumpingNFT`],
        arguments: [
            tx.object(networkVariables.Kiosk.GameParkKioskCap),
            tx.object(params.nftID),
            tx.pure.u64(params.price)
        ]
    });
    return tx;
});