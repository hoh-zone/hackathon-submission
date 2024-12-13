export type BonusRecord = {
    id: string,
    gain: number,
    pay: number,
    pay_rate: number
    principal: number,
}

/** 
type BonusPeriod = {
    id: {id:string},
    time_ms: number,
    epoch: number,
    bonus_list: BonusRecord[]
}*/


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
    value: number
}
type StakedSui = {
    principal: Balance,
}
type Storage = {
    total_shares: number,
    total_staked: number,
    staked_suis: StakedSui[],
    left_balance: Balance,
    bonus_balance: Balance,
    bonus_donated: Balance,
    bonus_percent: number,
    fee_percent: number,
    seed: bigint,
}


export type StorageWrapper = {
    data: {
        content: {
            fields: Storage
        }
    }
}

