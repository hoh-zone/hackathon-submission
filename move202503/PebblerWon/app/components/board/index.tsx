import { CellStatus, Diffculty } from "@/app/components/game/definitions";
import { useGame } from "@/app/components/game/useGame";
import React from "react";
import { Game } from "../game/Game";
const positionArr = [
  [7, 5],
  [-34, 5],
  [-78, 4],
  [-123, 2],
  [-167, 2],
];
function Board(props: {
  diffculty: Diffculty;
  game: Game;
  verify: (index: number, diffculty: Diffculty) => void;
}) {
  const { game, verify } = props;

  return (
    <div className={`h-full grid grid-rows-6 grid-cols-4 gap-4`}>
      {game.board.flat().map((row, i) => {
        let imageStyle;
        if (row == CellStatus.Bad) {
          imageStyle = {
            backgroundImage: `url(skull.webp)`,
            backgroundSize: "100% 100%",
            backgroundColor: "transparent",
            borderRadius: 0,
          };
        } else {
          imageStyle = {
            backgroundImage: `url(fruit_bg.webp)`,
            backgroundSize: "200px 30px",
            backgroundPosition: `${positionArr[i % 5][0]}px ${
              positionArr[i % 5][1]
            }px`,
          };
          if (row == CellStatus.Good) {
            imageStyle.backgroundImage = `url(fruit_green.webp)`;
          }
        }

        return (
          <div
            key={i}
            className="cursor-pointer rounded-md flex items-center justify-center bg-[#3a4142] hover:bg-[#4a5354]"
            style={{
              backgroundImage: `url(cell_bg.png)`,
            }}
            onClick={() => {
              verify(i, props.diffculty);
            }}
          >
            <div
              style={{
                backgroundColor: "rgb(33,35,40)",
                backgroundRepeat: "no-repeat",
                width: 40,
                height: 40,
                borderRadius: "100%",
                ...imageStyle,
              }}
            ></div>
          </div>
        );
      })}
    </div>
  );
}

export default Board;
