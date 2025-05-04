"use client";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { HOUSD_DATA_ID, HOUSE_CAP_ID, TESTNET_PACKAGE_ID } from "../constants";
import { bcs } from "@mysten/sui/bcs";
import * as curveUtils from "@noble/curves/abstract/utils";
import { toast } from "react-toastify";
import {
  getFullnodeUrl,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Button } from "@radix-ui/themes";
import { useState } from "react";
import {
  ConnectButton,
  createNetworkConfig,
  SuiClientProvider,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  WalletProvider,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

import { bls12_381 as bls } from "@noble/curves/bls12-381";
import { useSuiClientQueries } from "@mysten/dapp-kit";

function MyComponent() {
  const { data, isPending, isError } = useSuiClientQueries({
    queries: [
      {
        method: "getAllBalances",
        params: {
          owner:
            "0x09be6b8995b7f56d8491a67f54519c56059d3fc24124470366b7ee5b51c27a91",
        },
      },
      {
        method: "queryTransactionBlocks",
        params: {
          filter: {
            FromAddress:
              "0x09be6b8995b7f56d8491a67f54519c56059d3fc24124470366b7ee5b51c27a91",
          },
        },
      },
    ],
    combine: (result) => {
      return {
        data: result.map((res) => res.data),
        isSuccess: result.every((res) => res.isSuccess),
        isPending: result.some((res) => res.isPending),
        isError: result.some((res) => res.isError),
      };
    },
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Fetching Error</div>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
const getHousePubHex = () => {
  const privKeyHex =
    "b812494dc68667013868c28f8c57e8aefb6b6b5a4c8e1992bc59eea37ebe80ac";
  return curveUtils.hexToBytes(privKeyHex).length === 32
    ? curveUtils.bytesToHex(bls.getPublicKey(privKeyHex))
    : "";
};
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();
const Form = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
        },
      }),
  });
  const currentAccount = useCurrentAccount();
  if (!account) return <div>Loading</div>;
  function initialize(e) {
    e.preventDefault();

    // Create new transaction
    const txb = new Transaction();
    // Split gas coin into house stake coin
    // SDK will take care for us abstracting away of up-front coin selections
    const [houseStakeCoin] = txb.splitCoins(txb.gas, [
      MIST_PER_SUI * BigInt(2),
    ]);
    // Calling smart contract function
    txb.moveCall({
      target: `${TESTNET_PACKAGE_ID}::house_data::initialize_house_data`,
      arguments: [
        txb.object(HOUSE_CAP_ID),
        houseStakeCoin,
        // This argument is not an on-chain object, hence, we must serialize it using `bcs`
        // https://sdk.mystenlabs.com/typescript/transaction-building/basics#pure-values
        txb.pure(
          bcs.vector(bcs.U8).serialize(curveUtils.hexToBytes(getHousePubHex()))
        ),
      ],
    });

    signAndExecuteTransaction(
      {
        transaction: txb,
        // options: {
        //   showObjectChanges: true,
        // },
      },
      {
        onError: (err) => {
          toast.error(err.message);
        },
        onSuccess: (result: SuiTransactionBlockResponse) => {
          let houseDataObjId;

          result.objectChanges?.some((objCh) => {
            if (
              objCh.type === "created" &&
              objCh.objectType ===
                `${TESTNET_PACKAGE_ID}::house_data::HouseData`
            ) {
              houseDataObjId = objCh.objectId;
              return true;
            }
          });

          toast.success(`Digest: ${result.digest}`);
        },
      }
    );
  }
  function withdraw(e) {
    e.preventDefault();

    const txb = new Transaction();

    txb.moveCall({
      target: `${TESTNET_PACKAGE_ID}::house_data::withdraw`,
      arguments: [txb.object(HOUSD_DATA_ID)],
    });

    signAndExecuteTransaction(
      {
        transaction: txb,
        // options: {
        //   showObjectChanges: true,
        // },
      },
      {
        onError: (err) => {
          toast.error(err.message);
        },
        onSuccess: (result: SuiTransactionBlockResponse) => {
          console.log(result);
          toast.success(`Digest: ${result.digest}`);
        },
      }
    );
  }
  return (
    <>
      <Button onClick={initialize} type="submit">
        Initialize
      </Button>
      <Button onClick={withdraw} type="submit">
        withdraw
      </Button>
      <MyComponent />
    </>
  );
};
export default function Owner() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <div style={{ position: "fixed", top: 10, right: 10 }}>
            <ConnectButton />
          </div>

          <Form />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
