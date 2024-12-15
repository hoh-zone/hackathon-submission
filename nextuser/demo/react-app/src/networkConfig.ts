import { getFullnodeUrl } from "@mysten/sui/client";
import {
devnet_consts,
mainnet_consts,
testnet_consts,
} from "./consts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      ...devnet_consts,
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      ...testnet_consts,
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      ...mainnet_consts,
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
