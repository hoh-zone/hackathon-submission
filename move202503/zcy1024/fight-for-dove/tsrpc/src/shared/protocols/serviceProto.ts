import { ServiceProto } from 'tsrpc-proto';
import { ReqDropAll, ResDropAll } from './PtlDropAll';
import { ReqEndGame, ResEndGame } from './PtlEndGame';
import { ReqGenerateProps, ResGenerateProps } from './PtlGenerateProps';
import { ReqGetGameInfo, ResGetGameInfo } from './PtlGetGameInfo';
import { ReqGetOwnedProps, ResGetOwnedProps } from './PtlGetOwnedProps';
import { ReqLogin, ResLogin } from './PtlLogin';
import { ReqNewGame, ResNewGame } from './PtlNewGame';
import { ReqNextLevel, ResNextLevel } from './PtlNextLevel';

export interface ServiceType {
    api: {
        "DropAll": {
            req: ReqDropAll,
            res: ResDropAll
        },
        "EndGame": {
            req: ReqEndGame,
            res: ResEndGame
        },
        "GenerateProps": {
            req: ReqGenerateProps,
            res: ResGenerateProps
        },
        "GetGameInfo": {
            req: ReqGetGameInfo,
            res: ResGetGameInfo
        },
        "GetOwnedProps": {
            req: ReqGetOwnedProps,
            res: ResGetOwnedProps
        },
        "Login": {
            req: ReqLogin,
            res: ResLogin
        },
        "NewGame": {
            req: ReqNewGame,
            res: ResNewGame
        },
        "NextLevel": {
            req: ReqNextLevel,
            res: ResNextLevel
        }
    },
    msg: {

    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 5,
    "services": [
        {
            "id": 0,
            "name": "DropAll",
            "type": "api"
        },
        {
            "id": 1,
            "name": "EndGame",
            "type": "api"
        },
        {
            "id": 6,
            "name": "GenerateProps",
            "type": "api"
        },
        {
            "id": 2,
            "name": "GetGameInfo",
            "type": "api"
        },
        {
            "id": 7,
            "name": "GetOwnedProps",
            "type": "api"
        },
        {
            "id": 3,
            "name": "Login",
            "type": "api"
        },
        {
            "id": 4,
            "name": "NewGame",
            "type": "api"
        },
        {
            "id": 5,
            "name": "NextLevel",
            "type": "api"
        }
    ],
    "types": {
        "PtlDropAll/ReqDropAll": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlDropAll/ResDropAll": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "success",
                    "type": {
                        "type": "Boolean"
                    }
                }
            ]
        },
        "PtlEndGame/ReqEndGame": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlEndGame/ResEndGame": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "success",
                    "type": {
                        "type": "Boolean"
                    }
                }
            ]
        },
        "PtlGenerateProps/ReqGenerateProps": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlGenerateProps/ResGenerateProps": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "success",
                    "type": {
                        "type": "Boolean"
                    }
                }
            ]
        },
        "PtlGetGameInfo/ReqGetGameInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
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
                                    "type": "Literal",
                                    "literal": null
                                }
                            },
                            {
                                "id": 2,
                                "type": {
                                    "type": "Literal"
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "PtlGetGameInfo/ResGetGameInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "info",
                    "type": {
                        "type": "Reference",
                        "target": "PtlGetGameInfo/UserInfoType"
                    }
                }
            ]
        },
        "PtlGetGameInfo/UserInfoType": {
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
                                                        "name": "game_state",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    },
                                                    {
                                                        "id": 1,
                                                        "name": "can_new_game_amount",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    },
                                                    {
                                                        "id": 2,
                                                        "name": "in_game_props",
                                                        "type": {
                                                            "type": "Array",
                                                            "elementType": {
                                                                "type": "Reference",
                                                                "target": "PtlGetGameInfo/PropsType"
                                                            }
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
        "PtlGetGameInfo/PropsType": {
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
                                "name": "id",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "id",
                                            "type": {
                                                "type": "String"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 1,
                                "name": "props_type",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 2,
                                "name": "quality",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 3,
                                "name": "image_url",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 4,
                                "name": "effects",
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
                                                        "name": "contents",
                                                        "type": {
                                                            "type": "Array",
                                                            "elementType": {
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
                                                                                        "type": "String"
                                                                                    }
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                ]
                                                            }
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
        "PtlGetOwnedProps/ReqGetOwnedProps": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "owner",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlGetOwnedProps/ResGetOwnedProps": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "props",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "PtlGetGameInfo/PropsType"
                        }
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
        "PtlNewGame/ReqNewGame": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlNewGame/ResNewGame": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "success",
                    "type": {
                        "type": "Boolean"
                    }
                }
            ]
        },
        "PtlNextLevel/ReqNextLevel": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "user",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlNextLevel/ResNextLevel": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "success",
                    "type": {
                        "type": "Boolean"
                    }
                }
            ]
        }
    }
};