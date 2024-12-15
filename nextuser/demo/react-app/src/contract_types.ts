export type BonusRecord = {
    id: string,
    gain: number,
    pay: number,
    pay_rate: number
    principal: number,
}

export type OperatorCap ={
    fields:{
        id : { id : string}
        operators : string[]
    }
}

/** 
type BonusPeriod = {
    id: {id:string},
    time_ms: number,
    epoch: number,
    bonus_list: BonusRecord[]
}*/

export type DepositEvent ={
    user : string,
    share_amount : number,
    amount : number,
    update_time_ms : number,
}
export type BonusWrapper = {
    type: string,
    fields: BonusRecord
}


export type BonusPeriodWrapper = {
    id: {id:string},
    time_ms: number,
    epoch: number,
    bonus_list: BonusWrapper[]
}

export type UserInfo ={
    id : string,
    orignal_amount : number,
    reward :number,
    bonus : number,
}
type Balance = {
    fields:{
        value: number
    }
}
type StakedSui = {
    principal: Balance,
}
export type StorageData = {
    total_shares: number,
    total_staked: number,
    user_shares : { type:string, fields: UserList},
    staked_suis: StakedSui[],
    left_balance: string,
    bonus_balance: string,
    bonus_donated: number,
    fee_balance:string,
    bonus_percent: number,
    fee_percent: number,
    seed: bigint,
}

export type StorageWrapper = {
    data: {
        content: {
            fields: StorageData
        }
    }
}

export type UserList = {
    count : number,
    keys : {type :string, fields : {id : string}},
    values : {type : string ,fields:{id:string}},
}

export type UserShare ={
    id : string;
    original_money : number;
    share_amount : number;
    bonus : number;
    update_time_ms:number;
    asset : number;

};


export type Field_address_UserShare={
    dataType : string,
    fields:{
        id : {id : string},
        name : string,
        value :{
            type:string,
            fields:unknown
        } ,
    }
}

export type FieldData = {
    type : string,
    fields : { id : {id :string}, size : number},
}

export type Field_u32_address={
    dataType : string,
    fields:{
        id : {id : string},
        name : number,
        value :string,
    }
}

 


export type FieldObject ={
    data : {
        objectId:string,
        content:{
            dataType:string,
            fields:Field_u32_address,
        }
    }

}


