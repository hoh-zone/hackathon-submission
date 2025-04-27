import { createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { QueryClient } from "@tanstack/react-query";

const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: getFullnodeUrl('mainnet'),
    package: "",
    module: "onchain_dapp_store",
    superAdminCap: "",
    browser: "https://suivision.xyz/account/",
  },
  testnet: {
    url: getFullnodeUrl('testnet'),
    package: "0xcc0f20a645775ce9fcc687145630219bfd19ca3ebc51efd3f951b61239789766",
    module: "onchain_dapp_store",
    storeInfo: "0x938ef41e4f3fd11dc1085ff4a0b6e840f94ce0cb2229fe29fd3d0ea6f5a13a26",
    superAdminCap: "0x4cf80b74b11f3aff8e6fdf5c60fca7d95fd211511373c076967dd6700c2a021a",
    superAdmin: "0x8b191c25d4dbaa3b49d77f9d8181ec57f616712192c264ec0d8f32779344dfa8",
    browser: "https://testnet.suivision.xyz/account/",
  }
});

const queryClient = new QueryClient();

const currentNetConfig = networkConfig.testnet;

const suiClient = new SuiClient({
  url: networkConfig.testnet.url,
});

export { networkConfig, currentNetConfig, queryClient, suiClient };