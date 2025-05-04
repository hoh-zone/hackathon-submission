"use client";

import React, { useContext, useEffect, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { TESTNET_PACKAGE_ID } from "@/app/constants";
import { GameContext, useGame } from "../game/useGame";
import { Game } from "../game/Game";
export const Addr = ({ addr }: { addr: string }) => {
  return (
    <span>
      {addr.slice(0, 8)}...{addr.slice(-8)}
    </span>
  );
};
export default function History({ game }: { game: Game; t?: number }) {
  const client = useSuiClient();
  const [list, setList] = useState<any>([]);
  console.log("History", game.status);
  useEffect(() => {
    console.log("game.status", game.status);
    client
      .queryEvents({
        query: {
          MoveModule: { package: TESTNET_PACKAGE_ID, module: "play" },
        },
      })
      .then((res) => {
        console.log(res);
        const events = res.data
          .filter((event) => {
            return (
              event.type.includes(`EGameWin`) ||
              event.type.includes(`EGameLoss`)
            );
          })
          .map((e) => {
            return {
              ...e,
              playType: e.type.includes(`EGameWin`) ? "Win" : "Loss",
            };
          })
          .reverse();
        setList(events);
      });
  }, [game.status]);

  return (
    <div className=" w-[340px] h-[730px] ml-2 flex flex-col">
      <div
        className="p-4 text-sm leading-3 rounded-t-xl"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(36, 238, 137), rgb(159, 232, 113))`,
        }}
      >
        History
      </div>
      <div
        className="p-4 overflow-y-auto rounded-b-xl flex-grow"
        style={{
          backgroundColor: "rgb(50 55 56)",
          color: "rgb(179 190 193)",
        }}
      >
        {list.map((i: any) => (
          <div className="hover:bg-slate-600 p-2" key={i.id.txDigest}>
            <Addr addr={i.parsedJson.player} />
            <span
              className="inline-block px-2 w-20 text-center"
              style={{
                color:
                  i.playType === "Win" ? "rgb(36, 238, 137)" : "rgb(255, 0, 0)",
              }}
            >
              {i.playType}
            </span>
            <span>0.1sui</span>
          </div>
        ))}
      </div>
    </div>
  );
}
