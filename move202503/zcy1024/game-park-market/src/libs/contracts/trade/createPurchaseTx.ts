'use client'

import {createBetterTxFactory} from "@/configs/networkConfig";
import {coinWithBalance} from "@mysten/sui/transactions";

export const createPurchaseTx = createBetterTxFactory<{
    sender: string,
    id: string,
    price: number,
    ownedNFTID: string | null | undefined
}>((tx, networkVariables, params) => {
    tx.setSender(params.sender);

    if (params.ownedNFTID) {
        tx.moveCall({
            package: networkVariables.Jumping.PackageID,
            module: "data",
            function: "clear_user_info",
            arguments: [
                tx.object(networkVariables.Jumping.DataPool),
                tx.object(params.ownedNFTID)
            ]
        });
    }

    tx.moveCall({
        package: networkVariables.Kiosk.PackageID,
        module: "kiosk",
        function: "purchase",
        typeArguments: [`${networkVariables.Jumping.PackageID}::nft::BlackSquidJumpingNFT`],
        arguments: [
            tx.object(networkVariables.Kiosk.GameParkKioskCap),
            tx.pure.id(params.id),
            coinWithBalance({
                balance: params.price,
                type: `${networkVariables.GP.PackageID}::gp::GP`
            }),
            tx.object(networkVariables.GP.GPTreasuryCap),
            tx.object(networkVariables.GP.Pool)
        ]
    });
    return tx;
});