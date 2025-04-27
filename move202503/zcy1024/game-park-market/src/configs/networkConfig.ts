import {getFullnodeUrl, SuiClient} from "@mysten/sui/client";
import {createNetworkConfig} from "@mysten/dapp-kit";
import {Transaction} from "@mysten/sui/transactions";

type Network = "mainnet" | "testnet";

const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

const {networkConfig, useNetworkVariable, useNetworkVariables} = createNetworkConfig({
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
            Kiosk: {
                PackageID: "",
                UpgradeCap: "",
                Publisher: "",
                GameParkKioskCap: ""
            },
            Jumping: {
                PackageID: "",
                UpgradeCap: "",
                Publisher: "",
                DataPool: "",
                EndlessGame: ""
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
            Kiosk: {
                PackageID: "0x2ca93b0217a841bb8306678122bfcefd295f57b68a5c09a2e2f969236ee1eece",
                UpgradeCap: "0x2c0adaa61f5795a8738af77abeaf2043f1829cea209399ed4b5841241b25ed14",
                Publisher: "0xe9b3dd5236a706dde56c68ac476d862d4ff4e5c3558ea04f6668b06f1f3e86f6",
                GameParkKioskCap: "0x42e45cc00451a346cbd76eb6c6ce0bf37cf028b5deb3744ead7ceaa5a610350f"
            },
            Jumping: {
                PackageID: "0x5da4fca2f86ccaf4b3b6a9564c851b89708e82797c982878de74133c14d1305f",
                UpgradeCap: "0xa47f58cfc344355e06bfa2436177954b5845334bf715550ecc1ed615b4744b98",
                Publisher: "0xd8e658f23e0657b0c51da0e21c4b67f5133595fae0927665b344d588d5bda79d",
                DataPool: "0xc9cdae81c480d7bf7215043a1a875f4c51a06f7f8ce0fbd687e4780b3396bde3",
                EndlessGame: "0xfac108a3a4f559feb02da45cf080f6a6fc4d70d54a3c23cbb2966535e207ca58"
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
});

const suiClient = new SuiClient({
    url: networkConfig[network].url
});

type NetworkVariables = ReturnType<typeof useNetworkVariables>;

function getNetworkVariables() {
    return networkConfig[network].variables;
}

function createBetterTxFactory<T extends Record<string, unknown>>(
    fn: (tx: Transaction, networkVariables: NetworkVariables, params: T) => Transaction
) {
    return (params: T) => {
        const tx = new Transaction();
        const networkVariables = getNetworkVariables();
        return fn(tx, networkVariables, params);
    }
}

export type {NetworkVariables};
export {
    network,
    useNetworkVariable,
    useNetworkVariables,
    networkConfig,
    suiClient,
    createBetterTxFactory
}