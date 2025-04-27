export type GameInfoType = {
    fields: {
        key: string,
        value: {
            fields: {
                list: string | number,
                row: string | number,
                end: string | number,
                cur_step_paid: string | number,
                final_reward: string | number
            }
        }
    }
}

export interface ReqGetGameInfo {
    address: string,
    nftID: string
}

export interface ResGetGameInfo {
    gameInfo: GameInfoType[]
}