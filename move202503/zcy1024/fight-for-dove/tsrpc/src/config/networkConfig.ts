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
            FFD: {
                PackageID: "",
                UpgradeCap: "",
                Publisher: "",
                PropsList: "",
                Data: ""
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
            FFD: {
                PackageID: "0x0e5a6f507dcd5fb27b8b61a36d5feb29cea3502b80f85e29012ce243c0acdc2a",
                UpgradeCap: "0xa24da467f5965b8833fc6f94170440c93e0c65553dbe292f738fd80430b58b72",
                Publisher: "0x9b695c08eae3d81fd8bea703ca5759b0cf94685528b81da4417461ac01d75b7d",
                PropsList: "0xd7477c0049a4dbb62f39d24abc0343a5d05e78303c280ea570ed57ac8ed9ff87",
                Data: "0x54865c472270a82b1a6da071a8a6058e744d6a83aa1c08a1a0f4b0fceecf28ce"
            }
        }
    }
}

dotenv.config();

export const suiClient = new SuiClient({url: networkConfig[network].url});
export const keypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!);