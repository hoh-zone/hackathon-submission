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
        package_id: '0x847fa8f44626965ea60da104cb516e23f07295368638349732c32e40121ab9c3',
        admin_cap:"0x4e1465a4b512eb7ffea9fbfec6cbffbf36775f9a27829dbb648da6c3d9e90ad6",
        operator_cap:"0xc817ed4dce069bf0f1655fc2c153c7d414bab419a6c19848c6363047fd78eb2f",
        bonus_history:"0xb766bf842ed30fc0a692702e60e28614fa27b23afeb56f82e70f780a081db2ef",
        storage:"0x45951d2df97d4157fc078e692f3b768f55f20bc9cf922ba755435c00a882e206",
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


