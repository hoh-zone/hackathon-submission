export type CardType = "wusdc" | "wbtc" | "wal" | "cetus" | "usdt" | "sui" | "navx" | "deep" | "fdusd" | "ns" |"blue"|"scallop";

export interface Card {
  id: string;
  type: CardType;
  image: string;
}

export interface CardSlots {
  id: string;
  cards: Card[];
}
export type DailyLeaderboardEvent = {
  player: string;
  card_count: string; // 改为与合约一致的字段名
};


export interface IncentiveSubmitPreviewResult {
  endPlayer: string;
  endAmount: bigint;
  ownPlayer: string;
  ownAmount: bigint;
  firstPlayer: string;
  firstAmount: bigint;
 
}