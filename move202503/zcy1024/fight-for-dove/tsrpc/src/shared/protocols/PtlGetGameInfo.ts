export type FFDataType = {
    fields: {
        users: {
            fields: {
                id: {
                    id: string
                }
            }
        }
    }
}

export type PropsType = {
    fields: {
        id: {
            id: string
        },
        props_type: string,
        quality: string,
        image_url: string,
        effects: {
            fields: {
                contents: {
                    fields: {
                        key: string,
                        value: string
                    }
                }[]
            }
        }
    }
}

export type UserInfoType = {
    fields: {
        value: {
            fields: {
                game_state: string,
                can_new_game_amount: string,
                in_game_props: PropsType[]
            }
        }
    }
}

export interface ReqGetGameInfo {
    user: string | null | undefined
}

export interface ResGetGameInfo {
    info: UserInfoType
}