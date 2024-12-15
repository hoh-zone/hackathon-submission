// import * as dotenv from 'dotenv';
import { bcs } from "@mysten/sui/bcs";
// import { fromBase64 } from '@mysten/bcs';
// import { SuiClient, type SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig,useNetworkVariable } from "./networkConfig";
///import { NetworkConsts } from "./consts";
import { BonusPeriodWrapper,UserInfo,StorageWrapper,BonusWrapper,BonusRecord,StorageData} from './contract_types'
import {UserList,Field_address_UserShare,FieldObject,FieldData,UserShare} from './contract_types'
import { devnet_consts as consts } from "./consts";
console.log(networkConfig)
console.log(useNetworkVariable);
import { SuiClient } from "@mysten/sui/client";
export function get_zero_share(addr : string):UserShare{
    return {
            id :  addr,
            original_money : 0,
            share_amount : 0,
            bonus : 0,
            update_time_ms:0,
            asset : 0,
    };
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
    amount = amount 
    console.log("deposit amount" + amount);
    let tx = new Transaction();
    let [coin] = tx.splitCoins(tx.gas ,[amount]);
    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::deposit`,
        arguments:[ tx.object(consts.CLOCK),tx.object(consts.storage),tx.object(consts.SYSTEM_STATE),
                    tx.object(consts.VALIDATOR),coin]
    })

    tx.setGasBudget(1e8);
    return tx;
}
/**
 * 
 * @param to withdraw_and_allocate_bonus(_ : &OperatorCap,
                                    clock : &Clock,
                                    storage :&mut Storage,
                                    system_state : &mut SuiSystemState,
                                    random : &Random,
                                    validator_address:address ,  
                                    bonus_history :&mut BonusHistory,
                                    ctx : &mut TxContext) 
 
 */
export function get_allocate_bonus_tx() : Transaction{
    console.log("assign alloc bonus " );
    let tx = new Transaction();

    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::withdraw_and_allocate_bonus`,
        arguments:[tx.object(consts.operator_cap), tx.object(consts.CLOCK),tx.object(consts.storage),
                   tx.object(consts.SYSTEM_STATE),tx.object(consts.RND),tx.object(consts.VALIDATOR),
                   tx.object(consts.bonus_history)]
    })

    tx.setGasBudget(1e8);
    return tx;
}

//entry fun assign_operator( _ : &AdminCap,operator_cap : &mut OperatorCap, to :address)
export  function get_assign_tx(to:string) :Transaction{
    to = to.trim();
    console.log("assign to " , to);
    let tx = new Transaction();

    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::assign_operator`,
        arguments:[ tx.object(consts.admin_cap),tx.object(consts.operator_cap),tx.pure.address(to)]
    })

    tx.setGasBudget(1e7);
    return tx;
}

//public(package) entry fun donate_bonus(storage : &mut Storage, coin : Coin<SUI>)
export  function get_donate_tx(amount : number) :Transaction{

    console.log("donate " , amount);
    let tx = new Transaction();
    let [coin] = tx.splitCoins(tx.gas ,[amount]);
    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::donate_bonus`,
        arguments:[ tx.object(consts.storage), coin]
    })

    tx.setGasBudget(1e7);
    return tx;
}
/** 
entry fun entry_withdraw(clock: &Clock,storage: & mut Storage,wrapper: &mut SuiSystemState,
    amount : u64,ctx : &mut TxContext)*/
export  function get_withdraw_tx(amount :number ) :Transaction{
    amount = amount 
    console.log("withdraw amount" + amount);
    let tx = new Transaction();
    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::entry_withdraw`,
        arguments:[ tx.object(consts.CLOCK),tx.object(consts.storage),
                    tx.object(consts.SYSTEM_STATE),tx.pure.u64(amount) ]
    })

    tx.setGasBudget(1e8);
    return tx;
}

/**
 * entry fun withdraw_fee(_:&AdminCap,storage : &mut Storage,amount : u64 ,ctx : &mut TxContext)
 * @param amount 
 * @returns 
 */
export  function get_withdraw_fee_tx(amount :number ) :Transaction{
    amount = amount 
    console.log("withdraw amount" + amount);
    let tx = new Transaction();
    tx.moveCall({
        target : `${consts.package_id}::deposit_bonus::withdraw_fee`,
        arguments:[ tx.object(consts.admin_cap),tx.object(consts.storage),
                    tx.pure.u64(amount) ]
    })

    tx.setGasBudget(1e8);
    return tx;
}




export async function get_balance(suiClient: SuiClient, owner:string) : Promise<number>{
    let b = await suiClient.getBalance({ coinType : "0x2::sui::SUI",owner : owner});
    return Number(b.totalBalance)
}  

export async function get_storage(suiClient : SuiClient) : Promise<StorageData>{
    let result = await suiClient.getObject({ id: consts.storage, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: StorageData };
    return ret.fields
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
        // console.log('period addr',addr)
        let r = await  suiClient.getObject({id : addr, options :{showContent:true}});
        let data = r.data!.content! as unknown as { fields: BonusPeriodWrapper}
        periods.push(data.fields);

    }
    return periods;
}


export async  function get_operators(client : SuiClient) : Promise<string[]>{
    let result = await client.getObject({
        id: consts.operator_cap,
        options: {
            showContent: true,
        }
    });
    let content  = result.data!.content as unknown as OperatorCap;
    console.log('-----------get operators : ' ,content);
    return content.fields.operators
}


export async  function get_user_share( suiClient:SuiClient, addr : string) : Promise<UserShare>{
    let result = await suiClient.getObject({
        id: consts.storage,
        options: {
            showContent: true,
        }
    });
    console.log(result);
    let content = result.data!.content! as unknown as { fields: any };
    let new_storage = content.fields as unknown as StorageData;
    
    console.log("----------fields---------------")
    console.log(new_storage);
    let count = new_storage.user_shares.fields.count;
    if(count == 0){
        return get_zero_share(addr);
    }

    let values = new_storage.user_shares.fields.values;
    let values_id = ( values as unknown as FieldData).fields.id.id;
        
    let obj = await suiClient.getDynamicFieldObject({parentId: values_id, name : {type:'address', value:addr}})
    if(!obj.data || !obj.data!.content){
        return get_zero_share(addr);
    }
    let field = obj.data!.content as unknown as Field_address_UserShare;
    let share = field.fields.value.fields as UserShare;
    share.asset = share.share_amount * (new_storage.total_staked /new_storage.total_shares);
    console.log("share name:",field.fields.name);
    console.log('share---\n',share);
    return share;
}


export async  function get_owner( client:SuiClient,addr :string ) :Promise<string>{
    let result = await client.getObject({
        id: addr,
        options: {
            showOwner: true,
        }
    });
    let owner  = result.data!.owner;
    if(owner){
        let data = owner! as unknown as {AddressOwner:string};
        console.log(addr,' owner is ',data.AddressOwner);
        return data.AddressOwner
    }
    return "";

    
}

// export async  function get_operator(client : SuiClient) : Promise<string>{
//     return await get_owner(client,consts.operator_cap);
// }

export async  function get_admin(client : SuiClient ) : Promise<string>{
    return await get_owner(client,consts.admin_cap);
}

