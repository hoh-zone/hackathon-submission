//BONUS_PKG,"0x20ebc0e38995f52ebfc26acab3eb8395ec9c4ad78157eb35a4710cfb20c115c8
//PERIOD,"0x67592e2825b318fa3254d50502744dccb790f1cb97861da5f799423410f44338
export type NetworkConsts ={
        package_id: string;
        admin_cap:string;
        operator_cap:string;
        bonus_history:string;
        storage:string;
        ADMIN : string;
        OPERATOR:string;
        USER_1:string;
        USER_2:string;
        USER_3:string;
        VALIDATOR:string,
        CLOCK:string,
        RND:string,
        SYSTEM_STATE:string,
}

export const devnet_consts : NetworkConsts = {   
        package_id: '0x2999411df007eba89714b6d4161d13a548ba2fd527230e3f14f0923bd35267dd',
        admin_cap:"0xe1d7c6ac4bfce46dbcf14dce25889ae555bca5d265cedaa3da46f3cee1565581",
        operator_cap:"0x5f5da3305ebfb70ecf8e759bdd2790451b341916e83652f1c81ab4fafdec1b24",
        bonus_history:"0xe82717a6e4fd65e834d2b578e5b5d23e4f6025a66f66e9b2a0ccadd99fbcd7b1",
        storage:"0xc8e97322d950523fba1469bc9fedbfeb5baa99aaff603f572ab07cdc9c2cbd07",
        ADMIN : "0x42a27bbee48b8c97b05540e823e118fe6629bd5d83caf19ef8e9051bf3addf9e",
        OPERATOR:"0x8f6bd80bca6fb0ac57c0754870b80f2f47d3c4f4e815719b4cda8102cd1bc5b0",
        USER_1:"0x5e23b1067c479185a2d6f3e358e4c82086032a171916f85dc9783226d7d504de",
        USER_2:"0x16781b5507cafe0150fe3265357cccd96ff0e9e22e8ef9373edd5e3b4a808884",
        USER_3:"0xa23b00a9eb52d57b04e80b493385488b3b86b317e875f78e0252dfd1793496bb",
        VALIDATOR:"0x94beb782ccfa172ea8752123e73768757a1f58cfca53928e9ba918a2c44a695b",
        CLOCK:"0x6",
        RND:"0x8",
        SYSTEM_STATE:"0x5",
}


export const mainnet_consts : NetworkConsts = {   
        package_id: '',
        admin_cap:"",
        operator_cap:"",
        bonus_history:"",
        storage:"",
        ADMIN : "",
        OPERATOR:"",
        USER_1:"",
        USER_2:"",
        USER_3:"",
        VALIDATOR:"0x94beb782ccfa172ea8752123e73768757a1f58cfca53928e9ba918a2c44a695b",
        CLOCK:"0x6",
        RND:"0x8",
        SYSTEM_STATE:"0x5", 
}



export const testnet_consts : NetworkConsts = {   
        package_id: '',
        admin_cap:"",
        operator_cap:"",
        bonus_history:"",
        storage:"",
        ADMIN : "",
        OPERATOR:"",
        USER_1:"",
        USER_2:"",
        USER_3:"",
        VALIDATOR:"0x94beb782ccfa172ea8752123e73768757a1f58cfca53928e9ba918a2c44a695b",
        CLOCK:"0x6",
        RND:"0x8",
        SYSTEM_STATE:"0x5",
        
}


