import {
  CellStatus,
  Diffculty,
  GameStatus,
  getRandomElements,
} from "./definitions";

type Board = number[];
export enum GameVerifyStatus {
  Win = 1,
  Loss = 0,
  Error = -1,
}
export class Game {
  diffculty?: Diffculty;
  status: GameStatus;
  board: Board;
  creator?: string;
  gameId?: string;
  boardWidth = 4;
  boardHeight = 6;
  gameResult?: GameVerifyStatus;
  constructor() {
    this.status = GameStatus.Ready;
    this.board = [];
    this.initialGame();
  }

  initialGame() {
    for (let i = 0; i < this.boardHeight * this.boardWidth; i++) {
      this.board[i] = CellStatus.ToVerify;
    }
    this.gameResult = undefined;
  }
  verify(index: number, diffculty: Diffculty, result: boolean) {
    const clickedCell = this.board[index];
    if (clickedCell == undefined) GameVerifyStatus.Error;
    if (clickedCell !== CellStatus.ToVerify) {
      return GameVerifyStatus.Error;
    }
    if (result) {
      this.board[index] = CellStatus.Good;
      this.gameOver(true, index, diffculty);
      return GameVerifyStatus.Win;
    } else {
      // game over
      this.board[index] = CellStatus.Bad;
      this.gameOver(false, index, diffculty);
      return GameVerifyStatus.Loss;
    }
  }

  gameOver(result: boolean, index: number, diffculty: Diffculty) {
    this.status = GameStatus.Done;

    let badRate = 0;
    if (diffculty == Diffculty.EASY) {
      badRate = 12;
    } else if (diffculty == Diffculty.MIDDLE) {
      badRate = 16;
    } else if (diffculty == Diffculty.HARD) {
      badRate = 18;
    }
    const a = getRandomElements(this.boardWidth * this.boardHeight, badRate);
    for (let i = 0; i < a.length; i++) {
      if (this.board[a[i]] == CellStatus.ToVerify) {
        this.board[a[i]] = CellStatus.Bad;
      }
    }
    if (result) {
      this.board[index] = CellStatus.Good;
      this.gameResult = GameVerifyStatus.Win;
    } else {
      this.board[index] = CellStatus.Bad;
      this.gameResult = GameVerifyStatus.Loss;
    }
    this.status = GameStatus.Done;
  }
  running() {
    this.status = GameStatus.Running;
  }
  reset() {
    this.status = GameStatus.Ready;
    this.board = [];
    this.initialGame();
  }
}
