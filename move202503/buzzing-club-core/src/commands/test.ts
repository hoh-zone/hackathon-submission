import { Command } from "commander";
import { getSigner } from "../tools";
import { logger, network } from "../config";
import {
  ClmmPoolUtil,
  initCetusSDK,
  TickMath,
  adjustForSlippage,
  Percentage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import Decimal from "decimal.js";
import BN from "bn.js";

const testCommand = new Command("test");

const signer = getSigner();
const sdk = initCetusSDK({ network: network });
const client = new SuiClient({ url: getFullnodeUrl(network) });

const tokenA =
  "0x5ec0de078e2ed68f829954d90a56b2c288c4045b49936ee0e9ed3331899af961::coin::COIN";
const tokenB =
  "0xea03dfc9d36e132bfff74620d59ed61ebaf66c0ce3c6138084bf221494deea4e::token::TOKEN";

testCommand.command("get-pool").action(async () => {
  const pools = await sdk.Pool.getPools([
    "0xa742811e25c89a6f4c52693ec120b401a1286614616b3e3798792c6613028a9b",
  ]);
  logger.info(`pools: ${JSON.stringify(pools[0], null, 2)}`);
});

testCommand.command("swap").action(async () => {
  sdk.senderAddress = signer.toSuiAddress();
  const a2b = true;
  logger.info(`swap action ... senderAddress: ${sdk.senderAddress}`);
  const slippage = Percentage.fromDecimal(d(5));
  const pool = await sdk.Pool.getPool(
    "0xa742811e25c89a6f4c52693ec120b401a1286614616b3e3798792c6613028a9b"
  );

  if (!pool || !pool.current_sqrt_price) {
    logger.error("pool not found");
    return;
  }

  const metadataA = await client.getCoinMetadata({
    coinType: pool.coinTypeA,
  });
  const metadataB = await client.getCoinMetadata({
    coinType: pool.coinTypeB,
  });

  if (!metadataA || !metadataB) {
    logger.error("metadata not found");
    return;
  }

  logger.info(`token a: ${pool.coinTypeA}`);
  logger.info(`token a decimals: ${metadataA.decimals}`);
  logger.info(`token b: ${pool.coinTypeB}`);
  logger.info(`token b decimals: ${metadataB.decimals}`);

  // a2b true means input a swap b
  const preSwap: any = await sdk.Swap.preswap({
    pool: pool,
    currentSqrtPrice: pool.current_sqrt_price,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    decimalsA: metadataA.decimals, // coin a 's decimals
    decimalsB: metadataB.decimals, // coin b 's decimals
    a2b,
    byAmountIn: true, // fix token a amount
    amount: "100",
  });

  logger.info(`res: ${JSON.stringify(preSwap, null, 2)}`);

  logger.info(`amount: ${preSwap.amount}`);

  const toAmount = preSwap.byAmountIn
    ? preSwap.estimatedAmountOut
    : preSwap.estimatedAmountIn;
  logger.info(`toAmount: ${toAmount}`);
  const amountLimit = adjustForSlippage(
    new BN(toAmount),
    slippage,
    !preSwap.byAmountIn
  );
  logger.info(`amountLimit: ${amountLimit}`);
  const swapPayload = await sdk.Swap.createSwapTransactionPayload({
    pool_id: pool.poolAddress,
    a2b,
    by_amount_in: true,
    amount: preSwap.amount.toString(),
    amount_limit: amountLimit.toString(),
    swap_partner: undefined,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
  });

  const swapTxn = await sdk.fullClient.sendTransaction(signer, swapPayload);
  logger.info(`swapTxn: ${swapTxn?.digest}`);
});

testCommand.command("create-pool").action(async (options) => {
  logger.info(signer.toSuiAddress());

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
  const fix_coin_amount = new BN(100 * 1_000_000_000);
  // input token amount is token a
  const fix_amount_a = true;
  // slippage value 0.05 means 5%
  const slippage = 0.05;
  const cur_sqrt_price = new BN(initialize_sqrt_price);
  // Estimate liquidity and token amount from one amounts
  const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
    tick_lower,
    tick_upper,
    fix_coin_amount,
    fix_amount_a,
    true,
    slippage,
    cur_sqrt_price
  );
  // Estimate  token a and token b amount
  const amount_a = fix_amount_a
    ? fix_coin_amount.toNumber()
    : liquidityInput.tokenMaxA.toNumber();
  const amount_b = fix_amount_a
    ? liquidityInput.tokenMaxB.toNumber()
    : fix_coin_amount.toNumber();

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
    fix_amount_a,
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
  } else {
    logger.error("pool_create_event not found");
  }
});

export default testCommand;
