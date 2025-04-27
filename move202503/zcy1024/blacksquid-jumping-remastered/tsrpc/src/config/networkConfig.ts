import {getFullnodeUrl, SuiClient} from "@mysten/sui/client";
import {Ed25519Keypair} from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";

type Network = "mainnet" | "testnet";

export const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

export const networkConfig = {
    mainnet: {
        url: getFullnodeUrl("mainnet"),
        variables: {
            GP: {
                PackageID: "",
                UpgradeCap: "",
                Publisher: "",
                GPTreasuryCap: "",
                Pool: "",
                UserTable: ""
            },
            Jumping: {
                PackageID: "",
                UpgradeCap: "",
                Publisher: "",
                DataPool: "",
                EndlessGame: ""
            }
        }
    },
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: {
            GP: {
                PackageID: "0xed76019f4dd4bebdf513d03acdb66f6a728d69248e9046eead4d9a3420081e43",
                UpgradeCap: "0xf7313e2482ae62ca3ee60bfc88b921e64c7782cc302f3e168e65050483a22414",
                Publisher: "0xd17ab472275e9ab7e7c3254227d34313892c709ec6b4989d6fbcc51e309c85c0",
                GPTreasuryCap: "0xf5c66cec799efa7498b454c9b85132e77bf4a6265015043ab8046a98c730dc3c",
                Pool: "0x428f4d7a24bd58f3a52cff40eb6714679e8b7635009467797982140160b90446",
                UserTable: "0x9424be761fd89f5d2c6615536f1747f45ac6c3ad60e7f90f2f92744ad5d6752f"
            },
            Jumping: {
                PackageID: "0x5da4fca2f86ccaf4b3b6a9564c851b89708e82797c982878de74133c14d1305f",
                UpgradeCap: "0xa47f58cfc344355e06bfa2436177954b5845334bf715550ecc1ed615b4744b98",
                Publisher: "0xd8e658f23e0657b0c51da0e21c4b67f5133595fae0927665b344d588d5bda79d",
                DataPool: "0xc9cdae81c480d7bf7215043a1a875f4c51a06f7f8ce0fbd687e4780b3396bde3",
                EndlessGame: "0xfac108a3a4f559feb02da45cf080f6a6fc4d70d54a3c23cbb2966535e207ca58"
            }
        }
    }
}

dotenv.config();

export const suiClient = new SuiClient({url: networkConfig[network].url});
export const keypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!);