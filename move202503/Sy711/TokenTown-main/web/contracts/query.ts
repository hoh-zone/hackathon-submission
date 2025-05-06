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
export const getPaymentEvents = async (): Promise<number | null> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::PaymentEvent`;
  
  // 获取当前时间范围
  const startOfDay = dayjs().startOf('day').unix(); // 秒级时间戳
  const endOfDay = dayjs().endOf('day').unix();
  
  const events = await suiClient.queryEvents({
    query: { MoveEventType: eventType },
    limit: 1,
    order: "descending"
  });

  // 遍历事件找到当天的
  for (const event of events.data) {
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳
    const tsSec = Math.floor(timestampMs / 1000);
    
    // 检查是否是当天的事件
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      const parsed = event.parsedJson as { amount: number };
      return parsed.amount/1_000_000_000;
    }
  }
  
  // 如果没有找到当天的事件，返回0
  return 0;
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

  // 用于按地址分组的Map
  const addressMap: Map<string, DailyLeaderboardEvent> = new Map();

  for (const event of response.data) {
    const parsed = event.parsedJson as DailyLeaderboardEvent;
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳

    const tsSec = Math.floor(timestampMs / 1000);
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      // 检查该地址是否已存在于Map中
      const existingEvent = addressMap.get(parsed.player);
      
      // 如果地址不存在或当前事件的card_count更大，则更新Map
      if (!existingEvent || BigInt(parsed.card_count) > BigInt(existingEvent.card_count)) {
        addressMap.set(parsed.player, parsed);
      }
    }
  }

  // 将Map中的值转换为数组
  const groupedEvents = Array.from(addressMap.values());

  // 按card_count排序
  return groupedEvents.sort((a, b) => Number(BigInt(b.card_count) - BigInt(a.card_count)));
};

export const getTodayFirstSubmitter = async (): Promise<string | null> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::FirstEvent`;
  const startOfDay = dayjs().startOf('day').unix(); // 秒级时间戳
  const endOfDay = dayjs().endOf('day').unix();

  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 1, // 增加限制以确保能获取到当天的事件
    order: "descending", // 最新的在最前
  });

  // 遍历事件找到当天的
  for (const event of events.data) {
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳
    const tsSec = Math.floor(timestampMs / 1000);
    
    // 检查是否是当天的事件
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      const parsed = event.parsedJson as { player: string };
      return parsed.player;
    }
  }

  // 如果没有找到当天的事件，返回 null
  return null;
};


export const getLatestIncentiveSubmitEvent = async (): Promise<IncentiveSubmitPreviewResult | null> => {
  const eventType = `${networkConfig.testnet.variables.Package}::card::IncentiveSubmitEvent`;

  // 获取当前时间范围
  const startOfDay = dayjs().startOf('day').unix(); // 秒级时间戳
  const endOfDay = dayjs().endOf('day').unix();

  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 1, // 增加限制以确保能获取到当天的事件
    order: "descending", // 最新的在最前
  });

  // 遍历事件找到当天的
  for (const event of events.data) {
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳
    const tsSec = Math.floor(timestampMs / 1000);
    
    // 检查是否是当天的事件
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      // 解析事件内容为 IncentiveSubmitPreviewResult
      const parsed = event.parsedJson as IncentiveSubmitPreviewResult;
      return parsed;
    }
  }

  // 如果没有找到当天的事件，返回 null
  return null;
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