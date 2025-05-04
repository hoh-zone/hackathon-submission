"use client";

import { useState, createContext, useContext } from "react";
import { Diffculty, GameStatus } from "./definitions";
import { toast } from "react-toastify";

import { Game } from "./Game";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { HOUSD_DATA_ID, TESTNET_PACKAGE_ID } from "@/app/constants";
import { MIST_PER_SUI } from "@mysten/sui/utils";

export const GameContext = createContext(new Game());
export function useGame() {
  const [t, setT] = useState(1);
  const game = useContext(GameContext);
  const client = useSuiClient();

  const { mutate: execCreateGame } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      }),
  });

  function verify(index: number, diffculty: Diffculty) {
    if (game.status !== GameStatus.Ready) {
      toast.error("Game is not ready");
      return;
    }
    const txb = new Transaction();
    toast.loading(0);
    game.running();
    const [houseStakeCoin] = txb.splitCoins(txb.gas, [
      (MIST_PER_SUI * BigInt(1)) / 10n,
    ]);
    const [gameid] = txb.moveCall({
      target: `${TESTNET_PACKAGE_ID}::play::start_game`,
      arguments: [
        txb.pure.u8(diffculty),
        houseStakeCoin,
        txb.object(HOUSD_DATA_ID),
      ],
    });

    console.log(gameid);
    // game.verify(index, diffculty, false);
    // setT((t)=>(t + 1));
    // return;
    txb.moveCall({
      target: `${TESTNET_PACKAGE_ID}::play::step`,
      arguments: [
        gameid,
        txb.pure.u8(index),
        txb.object(HOUSD_DATA_ID),
        txb.object("0x8"),
      ],
    });
    execCreateGame(
      {
        transaction: txb,
      },
      {
        onError: (err) => {
          setT(t + 1);
          console.log(err, "onerror");
          toast.dismiss();
          toast.error(err.message);
        },
        onSuccess: (result) => {
          console.log(result);
          toast.dismiss();
          const { events } = result;
          if (events && events.length) {
            for (let i = 0; i < events.length; i++) {
              let e = events[i];

              if (e.type === `${TESTNET_PACKAGE_ID}::play::EGameLoss`) {
                toast.error("Sry, you loss!");
                game.verify(index, diffculty, false);
              } else if (e.type === `${TESTNET_PACKAGE_ID}::play::EGameWin`) {
                toast.success("Woo!!! you win!");
                game.verify(index, diffculty, true);
              }
              setT(t + 1);
            }
          }
        },
      }
    );
    setT(t + 1);
  }
  function resetGame() {
    game.reset();
    setT(t + 1);
  }
  return {
    game,
    verify,
    resetGame,
    t,
  };
}
