import { ServiceProto } from 'tsrpc-proto';
import { ReqGetEndlessGameInfo, ResGetEndlessGameInfo } from './PtlGetEndlessGameInfo';
import { ReqGetGameInfo, ResGetGameInfo } from './PtlGetGameInfo';
import { ReqGetNFT, ResGetNFT } from './PtlGetNFT';
import { ReqLogin, ResLogin } from './PtlLogin';
import { ReqNextStep, ResNextStep } from './PtlNextStep';

export interface ServiceType {
    api: {
        "GetEndlessGameInfo": {
            req: ReqGetEndlessGameInfo,
            res: ResGetEndlessGameInfo
        },
        "GetGameInfo": {
            req: ReqGetGameInfo,
            res: ResGetGameInfo
        },
        "GetNFT": {
            req: ReqGetNFT,
            res: ResGetNFT
        },
        "Login": {
            req: ReqLogin,
            res: ResLogin
        },
        "NextStep": {
            req: ReqNextStep,
            res: ResNextStep
        }
    },
    msg: {

    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 7,
    "services": [
        {
            "id": 4,
            "name": "GetEndlessGameInfo",
            "type": "api"
        },
        {
            "id": 1,
            "name": "GetGameInfo",
            "type": "api"
        },
        {
            "id": 2,
            "name": "GetNFT",
            "type": "api"
        },
        {
            "id": 0,
            "name": "Login",
            "type": "api"
        },
        {
            "id": 3,
            "name": "NextStep",
            "type": "api"
        }
    ],
    "types": {
        "PtlGetEndlessGameInfo/ReqGetEndlessGameInfo": {
            "type": "Interface"
        },
        "PtlGetEndlessGameInfo/ResGetEndlessGameInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "endlessGameInfo",
                    "type": {
                        "type": "Reference",
                        "target": "PtlGetGameInfo/GameInfoType"
                    }
                }
            ]
        },
        "PtlGetGameInfo/GameInfoType": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "fields",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "key",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "value",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "fields",
                                            "type": {
                                                "type": "Interface",
                                                "properties": [
                                                    {
                                                        "id": 0,
                                                        "name": "list",
                                                        "type": {
                                                            "type": "Union",
                                                            "members": [
                                                                {
                                                                    "id": 0,
                                                                    "type": {
                                                                        "type": "String"
                                                                    }
                                                                },
                                                                {
                                                                    "id": 1,
                                                                    "type": {
                                                                        "type": "Number"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        "id": 1,
                                                        "name": "row",
                                                        "type": {
                                                            "type": "Union",
                                                            "members": [
                                                                {
                                                                    "id": 0,
                                                                    "type": {
                                                                        "type": "String"
                                                                    }
                                                                },
                                                                {
                                                                    "id": 1,
                                                                    "type": {
                                                                        "type": "Number"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        "id": 2,
                                                        "name": "end",
                                                        "type": {
                                                            "type": "Union",
                                                            "members": [
                                                                {
                                                                    "id": 0,
                                                                    "type": {
                                                                        "type": "String"
                                                                    }
                                                                },
                                                                {
                                                                    "id": 1,
                                                                    "type": {
                                                                        "type": "Number"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        "id": 3,
                                                        "name": "cur_step_paid",
                                                        "type": {
                                                            "type": "Union",
                                                            "members": [
                                                                {
                                                                    "id": 0,
                                                                    "type": {
                                                                        "type": "String"
                                                                    }
                                                                },
                                                                {
                                                                    "id": 1,
                                                                    "type": {
                                                                        "type": "Number"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        "id": 4,
                                                        "name": "final_reward",
                                                        "type": {
                                                            "type": "Union",
                                                            "members": [
                                                                {
                                                                    "id": 0,
                                                                    "type": {
                                                                        "type": "String"
                                                                    }
                                                                },
                                                                {
                                                                    "id": 1,
                                                                    "type": {
                                                                        "type": "Number"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "PtlGetGameInfo/ReqGetGameInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "address",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "nftID",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlGetGameInfo/ResGetGameInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "gameInfo",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "PtlGetGameInfo/GameInfoType"
                        }
                    }
                }
            ]
        },
        "PtlGetNFT/ReqGetNFT": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "address",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlGetNFT/ResGetNFT": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "nftID",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlLogin/ReqLogin": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "username",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "password",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "address",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlLogin/ResLogin": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "state",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlNextStep/ReqNextStep": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "nftID",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "hashKey",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "userPos",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "receipt",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlNextStep/ResNextStep": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "safePos",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        }
    }
};