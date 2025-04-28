import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient ,networkConfig,createBetterTxFactory} from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import {DailyLeaderboardEvent,IncentiveSubmitPreviewResult} from "@/types/game-types";
import dayjs from 'dayjs';
import { bcs } from "@mysten/sui/bcs";
import { DevInspectResults } from "@mysten/sui/client";

export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

// 新增支付事件查询
export const getPaymentEvents =  async (): Promise<number | null> =>{
  const eventType = `${networkConfig.testnet.variables.Package}::card::PaymentEvent`;
  
  const events = await suiClient.queryEvents({
    query: { MoveEventType: eventType },
    limit: 1,
    order: "descending"
  });

 
  const latest = events.data[0];
  if (!latest) return null;

  const parsed = latest.parsedJson as { amount: number };
  return parsed.amount/1_000_000_000;
};

// 修改后的每日排行榜事件查询
export const getTodayLeaderboard = async (): Promise<DailyLeaderboardEvent[]> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::DailyLeaderboardEvent`;

  // 获取当前时间范围
  const startOfDay = dayjs().startOf('day').unix(); // 秒级时间戳
  const endOfDay = dayjs().endOf('day').unix();

  const response = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 100, // 可调整
  });

  const todayEvents: DailyLeaderboardEvent[] = [];

  for (const event of response.data) {
    const parsed = event.parsedJson as DailyLeaderboardEvent;
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳

    const tsSec = Math.floor(timestampMs / 1000);
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      todayEvents.push(parsed);
    }
  }

  // 可排序
  return todayEvents.sort((a, b) => Number(BigInt(b.card_count) - BigInt(a.card_count)));
};

export const getTodayFirstSubmitter = async (): Promise<string | null> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::FirstEvent`;

  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 1,
    order: "descending", // 最新的在最前
  });

  const latest = events.data[0];
  if (!latest) return null;

  const parsed = latest.parsedJson as { player: string };
  return parsed.player;
};


export const getLatestIncentiveSubmitEvent = async (): Promise<IncentiveSubmitPreviewResult | null> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::IncentiveSubmitEvent`;

  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 1,
    order: "descending", // 最新的在最前
  });

  const latest = events.data[0];
  if (!latest) return null;

  // 解析事件内容为 IncentiveSubmitPreviewResult
  const parsed = latest.parsedJson as IncentiveSubmitPreviewResult;
  return parsed;
};






export const previewPaymentTx = createBetterTxFactory<
  { wallet: string| null;
   }
>(
  (tx, networkVariables, params) => {
    if (params.wallet) {
    tx.moveCall({
      target: `${networkVariables.Package}::card::payment`,
      arguments: [
        tx.object(params.wallet),
        tx.object(networkVariables.Vault)

      ],
    });}else{
      
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(200000000)]);

      tx.moveCall({
        package: networkVariables.Package,
        module: "card",
        function: "payment",
        arguments: [
          coin,
          tx.object(networkVariables.Vault),
        ],
      });
    }
    return tx;
  },
 
);



// 激励结算交易构建器 
export const previewIncentiveSubmitTx = createBetterTxFactory<
  {
    cardCount: number;
    time:number; 
  }
  
>(
  (tx, networkVariables, params) => {
    tx.moveCall({
      package: networkVariables.Package,
      module: "card",
      function: "submit",
      arguments: [
        tx.pure.u64(Number(params.cardCount)),
        tx.pure.u64(Number(params.time)),
          tx.object(networkVariables.Vault),
      ],
    });
    return tx;
  },
  

   
);