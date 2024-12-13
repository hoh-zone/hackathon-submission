// import * as dotenv from 'dotenv';
// import { bcs } from "@mysten/sui/bcs";
// import { fromBase64 } from '@mysten/bcs';
// import { SuiClient, type SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig,useNetworkVariable } from "./networkConfig";
///import { NetworkConsts } from "./consts";
import { BonusPeriodWrapper,UserInfo} from './contract_types'
import { devnet_consts as consts } from "./consts";
console.log(networkConfig)
console.log(useNetworkVariable);
import { SuiClient } from "@mysten/sui/client";

export function get_user_info_tx() :Transaction {
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    const  package_id = consts.package_id;

    let target = `${package_id}::deposit_bonus::entry_query_user_info`;
    tx.moveCall({
        target: target,
        arguments: [tx.object(consts.storge)],

    });
    return tx;

}

export async function get_period(suiClient:SuiClient) {
    
    let result = await suiClient.getObject({
        id: consts.period_id,
        options: {
            showContent: true,
            showBcs: true,
        }
    });
    console.log(result);
    let content = result.data!.content! as unknown as { fields: any };
    let period = content.fields as unknown as BonusPeriodWrapper;
    console.log(period);
    return period
}


export async function get_storage(suiClient : SuiClient) {
    let result = await suiClient.getObject({ id: consts.storge, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: Storage };
    console.log("storage :", ret);
}

export  async function get_bonus_record(suiClient:SuiClient){

    let result = await suiClient.getObject({ id: consts.bonus_history, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: { periods:string[]} };
    console.log("history:",ret);
    let period_addrs = ret.fields.periods;
    let len = period_addrs.length;
    for(let i = 0; i < len ; ++ i){
        let addr = period_addrs[i];
        console.log(addr)
        let r = await  suiClient.getObject({id : addr, options :{showContent:true}});
        let period = r.data!.content! as unknown as { fields: BonusPeriodWrapper}
        let b = period.fields.bonus_list[0];
        console.log("BONUS ELMENT",b);
        console.log("bonus :",period);
    }
}
