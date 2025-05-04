"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
  ConnectButton,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import GameApp from "./components/game";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  // testnet: { url: "https://rpc-testnet.suiscan.xyz/" },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();
console.log("networkconfig", networkConfig);
export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <div style={{ position: "fixed", top: 10, right: 10 }}>
            <ConnectButton />
          </div>
          <GameApp />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
