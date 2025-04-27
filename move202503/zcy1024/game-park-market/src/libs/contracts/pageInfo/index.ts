'use client'

import {network, networkConfig, suiClient} from "@/configs/networkConfig";

export async function getBalance(address: string): Promise<[number, number]> {
    const suiBalance = await suiClient.getBalance({
        owner: address
    });
    const gpBalance = await suiClient.getBalance({
        owner: address,
        coinType: `${networkConfig[network].variables.GP.PackageID}::gp::GP`
    });
    return [Number((Number(suiBalance.totalBalance) / 1000000000).toFixed(2)), Number(gpBalance.totalBalance)];
}