'use client'

import {createBetterTxFactory, network, networkConfig, suiClient} from "@/configs/networkConfig";
import {PropsType} from "@/store/modules/pageInfo";
import {getListing, getParentID} from "@/libs/contracts";
import {getGameInfo} from "@/libs/contracts/trade/getBuyObj";
import {DynamicFieldInfo} from "@mysten/sui/client";
import {coinWithBalance} from "@mysten/sui/transactions";

export async function getFFDNFTID(owner: string, cursor: string | null | undefined): Promise<string> {
    const data = await suiClient.getOwnedObjects({
        owner,
        cursor,
        options: {
            showType: true
        }
    });
    const found = data.data.find(item => item.data?.type === `${networkConfig[network].variables.FFD.PackageID}::nft::FightForDoveNFT`);
    return found ? found.data!.objectId : (data.hasNextPage ? await getFFDNFTID(owner, data.nextCursor) : "");
}

async function getOwnedProps(parentId: string, cursor: string | null | undefined): Promise<PropsType[]> {
    const data = await suiClient.getDynamicFields({
        parentId,
        cursor
    });
    const props: PropsType[] = [];
    for (let i = 0; i < data.data.length; i++) {
        props.push((await suiClient.getObject({
            id: data.data[i].objectId,
            options: {
                showContent: true
            }
        })).data?.content as unknown as PropsType);
    }
    if (data.hasNextPage)
        return props.concat(await getOwnedProps(parentId, data.nextCursor));
    return props;
}

export async function getFFDOwnedProps(owner: string) {
    const nft = await getFFDNFTID(owner, null);
    if (!nft)
        return [];
    return await getOwnedProps(nft, null);
}

export const placeFFDPropsTx = createBetterTxFactory<{
    nft: string,
    propsId: string,
    price: number
}>((tx, networkVariables, params) => {
    const [props] = tx.moveCall({
        package: networkVariables.FFD.PackageID,
        module: "nft",
        function: "remove_props",
        typeArguments: [`${networkVariables.FFD.PackageID}::props::Props`],
        arguments: [
            tx.object(params.nft),
            tx.pure.id(params.propsId)
        ]
    });
    tx.moveCall({
        package: networkVariables.Kiosk.PackageID,
        module: "kiosk",
        function: "place",
        typeArguments: [`${networkVariables.FFD.PackageID}::props::Props`],
        arguments: [
            tx.object(networkVariables.Kiosk.GameParkKioskCap),
            props,
            tx.pure.u64(params.price)
        ]
    });
    return tx;
});

async function combinedData(fields: DynamicFieldInfo[]) {
    const propsInfos: PropsType[] = [];
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const propsID = field.name.value as string;
        const [price, owner] = await getListing(field.objectId);
        const data = await suiClient.getObject({
            id: propsID,
            options: {
                showContent: true,
                showType: true
            }
        });
        if (data.data?.type !== `${networkConfig[network].variables.FFD.PackageID}::props::Props`)
            continue;
        const props = data.data?.content as unknown as PropsType;
        props.fields.price = price;
        props.fields.owner = owner;
        propsInfos.push(props);
    }
    return propsInfos;
}

export async function getMarketFFDProps() {
    const parentID = await getParentID(networkConfig[network].variables.Kiosk.GameParkKioskCap);
    const dynamicFields = await getGameInfo(parentID, null);
    return await combinedData(dynamicFields);
}

export const purchaseFFDPropsTx = createBetterTxFactory<{
    sender: string,
    nft: string,
    propsId: string,
    price: number
}>((tx, networkVariables, params) => {
    tx.setSender(params.sender);
    const nft = params.nft ? tx.object(params.nft) : tx.moveCall({
        package: networkVariables.FFD.PackageID,
        module: "nft",
        function: "mint"
    })[0];
    const [props] = tx.moveCall({
        package: networkVariables.Kiosk.PackageID,
        module: "kiosk",
        function: "purchase_to_use",
        typeArguments: [`${networkVariables.FFD.PackageID}::props::Props`],
        arguments: [
            tx.object(networkVariables.Kiosk.GameParkKioskCap),
            tx.pure.id(params.propsId),
            coinWithBalance({
                balance: params.price,
                type: `${networkVariables.GP.PackageID}::gp::GP`
            }),
            tx.object(networkVariables.GP.GPTreasuryCap),
            tx.object(networkVariables.GP.Pool)
        ]
    });
    tx.moveCall({
        package: networkVariables.FFD.PackageID,
        module: "nft",
        function: "add_props",
        typeArguments: [`${networkVariables.FFD.PackageID}::props::Props`],
        arguments: [
            nft,
            props
        ]
    });
    if (!params.nft)
        tx.transferObjects([nft], params.sender);
    return tx;
})