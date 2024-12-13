// import * as dotenv from 'dotenv';
// import { bcs } from "@mysten/sui/bcs";
// import { fromBase64 } from '@mysten/bcs';
// import { SuiClient, type SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig,useNetworkVariable } from "./networkConfig";
///import { NetworkConsts } from "./consts";
import { BonusPeriodWrapper,UserInfo,StorageWrapper,BonusWrapper,BonusRecord} from './contract_types'
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
    tx.setGasBudget(1e7);
    return tx;

}

export async function get_records(suiClient:SuiClient,period_id : string) :Promise<BonusRecord[]> {
    
    let result = await suiClient.getObject({
        id: period_id,
        options: {
            showContent: true,
            showBcs: true,
        }
    });
    console.log(result);
    let content = result.data!.content! as unknown as { fields: any };
    let period = content.fields as unknown as BonusPeriodWrapper;
    let record_list : BonusRecord[]  = [];
    for(let i = 0 ; i < period.bonus_list.length; ++ i){
        let record = period.bonus_list[i].fields
        record.gain = record.gain / 1e9
        record.pay = record.pay / 1e9
        record.principal = record.principal/ 1e9
        record_list.push(record);
    }
    console.log('get_records:',record_list);
    return record_list
}
//@$CLOCK @$STORAGE @$SYSTEM_STATE @$VALIDATOR new_coin \
export  function get_deposit_tx(amount :number ) :Transaction{
    amount = amount * 1e9
    console.log("deposit amount" + amount);
    let tx = new Transaction();
    let [coin] = tx.splitCoins(tx.gas ,[amount]);
    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::deposit`,
        arguments:[ tx.object(consts.CLOCK),tx.object(consts.storge),tx.object(consts.SYSTEM_STATE),
                    tx.object(consts.VALIDATOR),coin]
    })

    tx.moveCall({
        target: `${consts.package_id}::deposit_bonus::entry_query_user_info`,
        arguments: [tx.object(consts.storge)],

    });
    tx.setGasBudget(1e8);
    return tx;
}

export async function get_balance(suiClient: SuiClient, owner:string) : Promise<number>{
    let b = await suiClient.getBalance({ coinType : "0x2::sui::SUI",owner : owner});
    return Number(b.totalBalance)
}  



export async function get_storage(suiClient : SuiClient) {
    let result = await suiClient.getObject({ id: consts.storge, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: Storage };
    console.log("storage :", ret);
}

export  async function get_bonus_periods(suiClient:SuiClient) : Promise<BonusPeriodWrapper[]>{

    let result = await suiClient.getObject({ id: consts.bonus_history, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: { periods:string[]} };
    ///console.log("history:",ret);
    let period_addrs = ret.fields.periods;
    let periods : BonusPeriodWrapper[] = [];
    let len = period_addrs.length;
    for(let i = 0; i < len ; ++ i){
        let addr = period_addrs[i];
        console.log(addr)
        let r = await  suiClient.getObject({id : addr, options :{showContent:true}});
        let data = r.data!.content! as unknown as { fields: BonusPeriodWrapper}
        periods.push(data.fields);

    }
    return periods;
}
