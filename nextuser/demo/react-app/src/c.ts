import { devnet_consts as consts } from './consts';
import * as dotenv from 'dotenv';
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import {ObjectOwner} from '@mysten/sui/client'
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/bcs';
import { get_key } from './local_key';
import {StorageWrapper,UserList,Field_u32_address,Field_address_UserShare,FieldObject,FieldData,UserShare} from './contract_types'

dotenv.config();
// 初始化SUI Client, 用于和主网(mainnet)交互
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });
// 从环境变量读取secretKey
const secretKey = process.env.SECRET_KEY || get_key();;
/** 这里把base64编码的secretKey转换为字节数组后截掉第一个元素，是因为第一位是一个私钥类型的标记位，后续派生签名者时不需要 **/
const secretKeyBytes = fromBase64(secretKey).slice(1); // 发起方账户私钥
const signer = Ed25519Keypair.fromSecretKey(secretKeyBytes); // 生成签名者

async  function get_user_shares(){
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
    let keys = new_storage.user_shares.fields.keys;
    console.log("keys--\n",keys);

    let keys_data = keys as unknown as FieldData;
    let keys_id =  keys_data.fields.id.id

    let size = keys_data.fields.size;

    let addrs = [];
    for(let i = 0; i < size ; ++ i){
        let keys_value = await suiClient.getDynamicFieldObject({parentId : keys_id, name:{type:'u32',value: i }})
        console.log('-------keys value:---\n',keys_value);
        let data = keys_value.data!.content as unknown as Field_u32_address;

        //let object = await suiClient.getObject({ id :data.data.objectId, options:{showContent : true} });

        console.log('u32=>addr data:\n',data);
        addrs.push(data.fields.value);
     }

    let values = new_storage.user_shares.fields.values;
    let values_id = ( values as unknown as FieldData).fields.id.id;

    
    for(let i = 0;i < addrs.length ; ++ i ){
        let addr = addrs[i];
        
        let obj = await suiClient.getDynamicFieldObject({parentId: values_id, name : {type:'address', value:addr}})
        
        let field = obj.data!.content as unknown as Field_address_UserShare;
        let share = field.fields.value.fields as UserShare;
        console.log("share name:",field.fields.name);
        console.log('share---\n',share);
    }

}

async  function get_user_share(client :SuiClient, addr : string){
    let result = await client.getObject({
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
        
    let obj = await client.getDynamicFieldObject({parentId: values_id, name : {type:'address', value:addr}})
    
    let field = obj.data!.content as unknown as Field_address_UserShare;
    let share = field.fields.value.fields as UserShare;
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


type OperatorCap ={
    fields:{
        id : { id : string}
        operators : string[]
    }
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



export async  function get_admin(client : SuiClient ){
    return await get_owner(client,consts.admin_cap);
}

//get_user_share(consts.USER_1);
//get_admin(suiClient).then(console.log);
get_operators(suiClient).then(console.log);