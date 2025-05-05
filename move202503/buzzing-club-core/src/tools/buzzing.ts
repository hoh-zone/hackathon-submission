import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { buzzingConfig, network, logger } from "../config";
import { Transaction } from "@mysten/sui/transactions";

const client = new SuiClient({
  url: getFullnodeUrl(network),
});

export interface Market {
  market_id: string;
  options_count: number;
  question: string;
  status: number;
  question_index: number;
  stake_coin_type: string;
  partitions: number[];
  token_metas: string[];
  token_pools: string[];
  oracle_cap: string;
}

const getMarket = async (marketId: string) => {
  const market = await client.getObject({
    id: marketId,
    options: {
      showDisplay: true,
      showContent: true,
      showType: true,
      showOwner: true,
    },
  });

  if (!market.data?.content) {
    throw new Error(`Market with ID ${marketId} not found`);
  }

  // Log market details for debugging
  console.log("Market Details:");
  console.log("Type:", market.data.type);
  console.log("Owner:", market.data.owner);
  // console.log("Display:", market.data.display);
  // console.log("Content:", market.data.content);

  const objectContent = market.data.content;

  if (objectContent && "fields" in objectContent) {
    let fields = objectContent.fields as any;

    const marketType = market.data.type;
    if (!marketType) {
      throw new Error("Market Type is not a valid type");
    }

    logger.info("Market Type:", marketType);
    const t_reg = RegExp("<.+>");
    let stake_coin_type = "0x2::sui::SUI";
    if (t_reg.test(marketType)) {
      const t_result = marketType.match(t_reg);
      if (!t_result) {
        throw new Error("Market Type is not a valid type");
      }
      stake_coin_type = t_result[0].replace("<", "").replace(">", "");
    } else {
      logger.error("Market Type is not a valid type");
    }

    return {
      market_id: fields.id.id,
      options_count: fields.options_count,
      question: fields.question,
      status: fields.status,
      question_index: fields.question_index,
      stake_coin_type: stake_coin_type,
      partitions: fields.partitions,
      token_metas: fields.token_metas,
      token_pools: fields.token_pools,
      oracle_cap: fields.oracle_cap,
    } as Market;
  }

  return null;
};

const getAdminCap = async (owner: string) => {
  const adminCapType = `${buzzingConfig.package}::buzzing::AdminCap`;
  const adminCap = await client.getOwnedObjects({
    owner,
    filter: {
      StructType: adminCapType,
    },
  });

  if (!adminCap.data || adminCap.data.length === 0) {
    logger.error(`AdminCap for ${owner} not found`);
    return null;
  }

  return adminCap.data[0].data?.objectId;
};

export const getCoins = async (
  tx: Transaction,
  owner: string,
  coinType: string,
  amount: number
) => {
  const coins = await client.getCoins({
    owner,
    coinType,
  });

  if (coins.data.length === 0) {
    throw new Error(
      `No coins found for owner ${owner} and coin type ${coinType}`
    );
  }

  if (coins.data.length === 1) {
    return [tx.object(coins.data[0].coinObjectId)];
  }

  let coinIds = coins.data.map((coin) => coin.coinObjectId);
  tx.mergeCoins(tx.object(coinIds[0]), coinIds.slice(1));
  return tx.splitCoins(tx.object(coinIds[0]), [amount]);
};

export const mintToken = async (owner: string, tokneType: string) => {
  const treasuryCap = await client.getOwnedObjects({
    owner,
    filter: {
      StructType: `0x2::coin::TreasuryCap<${tokneType}>`,
    },
  });

  if (treasuryCap.data.length === 0) {
    throw new Error(`TreasuryCap for ${tokneType} not found`);
  }

  const data = treasuryCap.data[0].data;
  if (!data) {
    throw new Error(`TreasuryCap for ${tokneType} not found`);
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${buzzingConfig.package}::buzzing::mint`,
    arguments: [tx.object(data.objectId)],
  });

  return tx;
};

// this always tokenB
export const getPlatformToken = () => {
  return `${buzzingConfig.package}::buzzing_token::BUZZING_TOKEN`;
};

export { getMarket, getAdminCap };
