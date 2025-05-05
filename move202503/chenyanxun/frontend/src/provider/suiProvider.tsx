"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  useSuiClientContext,
  WalletProvider,
} from "@mysten/dapp-kit";
import { defaultNetwork, networkConfig } from "@/app/networkconfig";
import "@mysten/dapp-kit/dist/index.css";
import { useEffect } from "react";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
const queryClient = new QueryClient();

export function SuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
      >
        <RegisterEnokiWallets />
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: "enoki_public_c9979bfb5935886eccc106d84a09bd72",
      providers: {
        // Provide the client IDs for each of the auth providers you want to use:
        google: {
          clientId:
            "179718222126-s2gr8vord96b0qtgs1mff0mt6a74rsao.apps.googleusercontent.com",
          redirectUrl: "http://127.0.0.1:9000",
        },
      },
      client,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}
