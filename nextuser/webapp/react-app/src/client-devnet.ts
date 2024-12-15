import { devnet_consts as consts } from './consts';
import * as dotenv from 'dotenv';
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/bcs';
import * as fs from 'fs';
import { get_key } from './local_key';
import { UserInfo,BonusPeriodWrapper,BonusRecord,StorageWrapper } from './contract_types';
import {UserList,Field_address_UserShare,FieldObject,FieldData,UserShare} from './contract_types'

dotenv.config();
// 初始化SUI Client, 用于和主网(mainnet)交互
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });
// 从环境变量读取secretKey
const secretKey = process.env.SECRET_KEY || get_key();;
/** 这里把base64编码的secretKey转换为字节数组后截掉第一个元素，是因为第一位是一个私钥类型的标记位，后续派生签名者时不需要 **/
const secretKeyBytes = fromBase64(secretKey).slice(1); // 发起方账户私钥
const signer = Ed25519Keypair.fromSecretKey(secretKeyBytes); // 生成签名者

// type BonusRecord = {
//     id: string,
//     gain: number,
//     pay: number,
//     pay_rate: number
//     principal: number,
// }


// type BonusPeriod = {
//     id: string,
//     time_ms: number,
//     epoch: number,
//     bonus_list: BonusRecord[]
// }


// type BonusWrapper = {
//     type: string,
//     fields: BonusRecord
// }

// type Value = { fields :BonusRecord}
// type BonusPeriodWrapper = {
//     id: string,
//     time_ms: number,
//     epoch: number,
//     bonus_list: BonusWrapper[]
// }


// function show_period(period: BonusPeriodWrapper) {
//     let p: BonusPeriod = {
//         id: period.id,
//         epoch: period.epoch,
//         time_ms: period.time_ms,
//         bonus_list: []
//     };
//     let list = p.bonus_list;
//     for (let i = 0; i < period.bonus_list.length; ++i) {
//         let wrapper = period.bonus_list[i];
//         let ub = wrapper.fields;
//         ub.pay_rate = ub.gain / ub.pay;
//         console.log(wrapper.fields);
//         list.push(ub);
//     }

//     let fd = fs.openSync('bonus_period.json', 'w')
//     fs.writeSync(fd, JSON.stringify(p));
//     fs.closeSync(fd);
// }
// type UserInfo ={
//     id : string,
//     orignal_amount : number,
//     reward :number,
//     bonus : number,
// }

// type Balance = {
//     value: number
// }
// type StakedSui = {
//     principal: Balance,
// }
// type Storage = {
//     total_shares: number,
//     total_staked: number,
//     staked_suis: StakedSui[],
//     left_balance: Balance,
//     bonus_balance: Balance,
//     bonus_donated: Balance,
//     bonus_percent: number,
//     fee_percent: number,
//     seed: bigint,
// }

async  function get_user_share( addr : string){
    let result = await suiClient.getObject({
        id: consts.storage,
        options: {
            showContent: true,
        }
    });
    console.log(result);
    let content = result.data!.content! as unknown as { fields: any };
    let new_storage = content.fields as unknown as Storage;
    console.log("----------fields---------------")
    console.log(new_storage);
    let count = new_storage.user_shares.fields.count;
    if(count == 0){
        return null;
    }

    let values = new_storage.user_shares.fields.values;
    let values_id = ( values as unknown as FieldData).fields.id.id;
        
    let obj = await suiClient.getDynamicFieldObject({parentId: values_id, name : {type:'address', value:addr}})
    
    let field = obj.data!.content as unknown as Field_address_UserShare;
    let share = field.fields.value.fields as UserShare;
    console.log("share name:",field.fields.name);
    console.log('share---\n',share);
    return share;
}


async function get_user_info() {
    const tx = new Transaction();
    tx.setGasBudget(200000000);
    let target = `${consts.package_id}::deposit_bonus::entry_query_user_info`;
    tx.moveCall({
        target: target,
        arguments: [tx.object(consts.storage)],

    });
    console.log(`ready call:target `);
    const result = await suiClient.signAndExecuteTransaction({
        signer: signer,
        transaction: tx
    });
    console.log("entry_query_user_info:", result)
    const response = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
            showEvents: true,
        },
    });
    
    console.log("wait result :", response);
    let  user_info =  response.events![0].parsedJson as unknown as UserInfo;
    console.log("user_info:",user_info);
    return user_info;
}


async function get_storage() {

    let result = await suiClient.getObject({ id: consts.storage, options: { showContent: true } });
    let ret = result.data!.content as unknown as { fields: Storage };
    console.log("storage :", ret);
}


async function get_bonus_record(){
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


//get_object()
//get_user_info();

//get_storage();

get_bonus_record();
get_user_share(consts.USER_2);