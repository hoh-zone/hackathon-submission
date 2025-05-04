"use client";

import { useState } from "react";
import { Diffculty, GameStatus } from "./definitions";
import Board from "../board";
import { useGame } from "./useGame";
import History from "../history";
import { GameVerifyStatus } from "./Game";

export default function GameApp() {
  const [diffculty, setDiffculty] = useState(Diffculty.EASY);
  const { resetGame, game, verify, t } = useGame();
  return (
    <main className="flex mx-auto mt-10 w-[1180px]">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "#323738",
        }}
      >
        <div
          className="w-[840px] h-[600px] flex justify-center items-center px-24"
          style={{
            backgroundImage: `url(big_bg.webp)`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="w-full h-full relative flex justify-end"
            style={{
              backgroundImage: `url(status_bg.webp)`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="absolute"
              style={{
                left: 0,
                width: "180px",
                height: "180px",
                transform: `rotate(-20deg)`,
                backgroundImage: `url(head.webp)`,
                backgroundPosition:
                  game.status == GameStatus.Done
                    ? game.gameResult == GameVerifyStatus.Win
                      ? "-720px 0px"
                      : "-370px 0px"
                    : `0px 0px`,
              }}
            ></div>
            <div className="w-[450px] h-full px-4 py-20 mr-4">
              <Board diffculty={diffculty} game={game} verify={verify} />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center w-full">
              <h2 className="text-xl" style={{ color: "rgb(179 190 193)" }}>
                Select Diffculty:
              </h2>
              <select
                className="ml-4 flex-grow"
                value={diffculty}
                onChange={(e) => {
                  console.log(e.target.value, typeof e.target.value);
                  setDiffculty(+e.target.value);
                }}
              >
                <option value={Diffculty.EASY}>easy</option>
                <option value={Diffculty.MIDDLE}>middle</option>
                <option value={Diffculty.HARD}>hard</option>
              </select>
            </div>
            {/* <div className="flex items-center ml-4 w-1/2">
              <h2 className="text-xl" style={{ color: "rgb(179 190 193)" }}>
                Bet Balance:
              </h2>
              <input
                type="number"
                className="ml-4 flex-grow"
                placeholder="please input bet amount"
                value={betBalance}
                onChange={(e) => {
                  setBetBalance(+e.target.value);
                }}
              ></input>
            </div> */}
          </div>
          <div
            className="mt-4 cursor-pointer h-10 leading-10 rounded-md text-center text-6 font-bold button"
            style={{
              backgroundImage: `linear-gradient(90deg, rgb(36, 238, 137), rgb(159, 232, 113))`,
            }}
            onClick={resetGame}
            // onClick={test}
          >
            Reset
          </div>
        </div>
      </div>
      <History game={game} t={t} />
    </main>
  );
}
