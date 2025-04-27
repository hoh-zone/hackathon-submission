import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageID: "0x33128e647d04bc5e0e29bfd313487e1e4bbae19789fb9e5d7155f8b723d46860",
        module: "hackathon_qidian",
        stateID: "0x36100b74c184cde455697571bd0b21da7042214f3f12d5f55c0d765cf71e513e",
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
  suiClient,
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
