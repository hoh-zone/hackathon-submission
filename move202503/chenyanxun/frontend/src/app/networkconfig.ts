import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageID: "0xb4581a53d5e1fa8303acc543515c09241b6c34cac95843262af0deb64e4fb61a",
        module: "hackathon_qidian",
        stateID: "0x77b47d5341feb2d51bfe56cb6985e8447398474abc57c6d36960b7cbfa0c87f1",
        coinPool: "",
        admin: "0xfe675584c55a561bd97cf709376daf0c318261432e92e260832f3e30d8aeae40"
      },
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageID: "",
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
    },
  });
const defaultNetwork = "testnet";
const suiClient = new SuiClient(networkConfig[defaultNetwork]);
const sealClient = new SealClient({
  suiClient: suiClient,
  serverObjectIds: getAllowlistedKeyServers(defaultNetwork),
});
export {
  useNetworkVariable,
  useNetworkVariables,
  networkConfig,
  suiClient,
  sealClient,
  defaultNetwork,
};
