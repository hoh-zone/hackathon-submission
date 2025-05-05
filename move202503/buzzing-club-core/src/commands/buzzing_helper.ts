import { getPlatformToken, Market } from "../tools/buzzing";
import { network, paths, logger } from "../config";
import { newToken as createNewToken } from "../tools/helper";
import { getSigner } from "../tools";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
  ClmmPoolUtil,
  initCetusSDK,
  TickMath,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import Decimal from "decimal.js";
import BN from "bn.js";

export const publishYesToken = async (
  market: Market,
  initialSupply: number
) => {
  const yesTokenName = `yes_${market.question_index}`;

  const { packageId: yesTokenPackageId, coinMedataId: yesTokenCoinMedataId } =
    await createNewToken(
      {
        name: yesTokenName,
        symbol: yesTokenName.toUpperCase(),
        decimals: 6,
        initialSupply,
      },
      paths.start
    );

  return {
    yesTokenPackageId,
    yesTokenCoinMedataId,
  };
};

export const publishNoToken = async (market: Market, initialSupply: number) => {
  const noTokenName = `no_${market.question_index}`;

  const { packageId: noTokenPackageId, coinMedataId: noTokenCoinMedataId } =
    await createNewToken(
      {
        name: noTokenName,
        symbol: noTokenName.toUpperCase(),
        decimals: 6,
        initialSupply,
        base64Icon: "",
      },
      paths.start
    );

  return {
    noTokenPackageId,
    noTokenCoinMedataId,
  };
};

export const createBuzzingPool = async (
  market: Market,
  tokenPackageId: string,
  tokenName: string
) => {
  const signer = getSigner();
  const client = new SuiClient({
    url: getFullnodeUrl(network),
  });

  const sdk = initCetusSDK({
    network,
  });

  const tokenA = `${tokenPackageId}::${tokenName}::${tokenName.toUpperCase()}`;
  const tokenB = getPlatformToken();

  const balanceA = await client.getBalance({
    owner: signer.toSuiAddress(),
    coinType: tokenA,
  });
  logger.info(`Balance of ${tokenA}: ${balanceA.totalBalance}`);

  const balanceB = await client.getBalance({
    owner: signer.toSuiAddress(),
    coinType: tokenB,
  });
  logger.info(`Balance of ${tokenB}: ${balanceB.totalBalance}`);

  const metadataA = await client.getCoinMetadata({
    coinType: tokenA,
  });
  logger.info(`Metadata of ${tokenA}: ${JSON.stringify(metadataA)}`);

  const metadataB = await client.getCoinMetadata({
    coinType: tokenB,
  });
  logger.info(`Metadata of ${tokenB}: ${JSON.stringify(metadataB)}`);

  if (!metadataA || !metadataB) {
    logger.error("metadata not found");
    return;
  }

  sdk.senderAddress = signer.toSuiAddress();
  const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(
    new Decimal(0.5),
    metadataA.decimals,
    metadataB.decimals
  );

  logger.info(`initialize_sqrt_price: ${initialize_sqrt_price}`);

  const tick_spacing = 2;
  const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(
    new BN(initialize_sqrt_price)
  );
  // build tick range
  const tick_lower = TickMath.getPrevInitializableTickIndex(
    new BN(current_tick_index).toNumber(),
    new BN(tick_spacing).toNumber()
  );
  const tick_upper = TickMath.getNextInitializableTickIndex(
    new BN(current_tick_index).toNumber(),
    new BN(tick_spacing).toNumber()
  );
  // input token amount
  const coin_amount = new BN(100 * 1_000_000);
  // input token amount is token a
  const is_coin_a = true;
  // slippage value 0.05 means 5%
  const slippage = 0.05;
  const cur_sqrt_price = new BN(initialize_sqrt_price);
  // Estimate liquidity and token amount from one amounts
  const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
    tick_lower,
    tick_upper,
    coin_amount,
    is_coin_a,
    true,
    slippage,
    cur_sqrt_price
  );
  // Estimate  token a and token b amount
  const amount_a = is_coin_a
    ? coin_amount.toNumber()
    : liquidityInput.tokenMaxA.toNumber();
  const amount_b = is_coin_a
    ? liquidityInput.tokenMaxB.toNumber()
    : coin_amount.toNumber();

  logger.info(`amount_a: ${amount_a}`);
  logger.info(`amount_b: ${amount_b}`);

  logger.info(`checking token a balance`);

  if (amount_a > Number(balanceA.totalBalance)) {
    logger.error(`token a balance is not enough`);
    return;
  } else {
    logger.info(`token a balance is enough`);
  }

  logger.info(`checking token b balance`);

  if (amount_b > Number(balanceB.totalBalance)) {
    logger.error(`token b balance is not enough`);
    return;
  } else {
    logger.info(`token b balance is enough`);
  }

  logger.info(`token a coin metata : ${metadataA.id}`);
  logger.info(`token b coin metata : ${metadataB.id}`);

  if (!metadataA.id || !metadataB.id) {
    logger.error("metadata not found");
    return;
  }

  // // build creatPoolPayload Payload
  const creatPoolPayload = await sdk.Pool.createPoolTransactionPayload({
    coinTypeA: tokenA,
    coinTypeB: tokenB,
    tick_spacing: tick_spacing,
    initialize_sqrt_price: initialize_sqrt_price.toString(),
    uri: "",
    amount_a,
    amount_b,
    fix_amount_a: is_coin_a,
    tick_lower,
    tick_upper,
    metadata_a: metadataA.id,
    metadata_b: metadataB.id,
    slippage,
  });

  logger.info(`creatPoolPayload: ${JSON.stringify(creatPoolPayload)}`);

  const result = await client.signAndExecuteTransaction({
    transaction: creatPoolPayload,
    signer,
  });

  logger.info(`result: ${result.digest}`);

  const waitResult = await client.waitForTransaction({
    digest: result.digest,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // logger.info(`waitResult: ${JSON.stringify(waitResult)}`);

  const events = waitResult.events;

  const pool_create_event = events?.filter((event) =>
    event.type.endsWith("::factory::CreatePoolEvent")
  );

  if (pool_create_event && pool_create_event.length > 0) {
    const pool_id = (pool_create_event[0].parsedJson as any).pool_id;
    logger.info(`pool_id: ${pool_id}`);
    return pool_id;
  } else {
    logger.error("pool_create_event not found");
  }
};
