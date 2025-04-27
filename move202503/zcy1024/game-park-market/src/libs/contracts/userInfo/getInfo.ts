'use client'

import {network, networkConfig, suiClient} from "@/configs/networkConfig";

type ContentType = {
    fields: {
        addr_name: {
            fields: {
                id: {
                    id: string
                }
            }
        }
    }
}

type NameContentType = {
    fields: {
        value: string
    }
}

async function getDynamic(account: string, parentId: string, cursor: string | null | undefined): Promise<string> {
    const res = await suiClient.getDynamicFields({
        parentId,
        cursor
    });
    const found = res.data.find(info => (info.name.value as string) === account);
    if (!found)
        return res.hasNextPage ? await getDynamic(account, parentId, res.nextCursor) : "";
    const info = await suiClient.getObject({
        id: found.objectId,
        options: {
            showContent: true
        }
    });
    return (info.data?.content as unknown as NameContentType).fields.value;
}

export default async function getInfo(account: string) {
    const userTable = await suiClient.getObject({
        id: networkConfig[network].variables.GP.UserTable,
        options: {
            showContent: true
        }
    });
    const content = userTable.data?.content as unknown as ContentType;
    return await getDynamic(account, content.fields.addr_name.fields.id.id, null);
}