import { Command } from "commander";
import { buzzingConfig, logger, network, paths } from "../config";
import { getSigner } from "../tools";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { runtime } from "../runtime";
import { getAdminCap, getCoins, getMarket } from "../tools/buzzing";
import {
  createBuzzingPool,
  publishNoToken,
  publishYesToken,
} from "./buzzing_helper";
import { coinMetadataToCoinType, transactionLink } from "../tools/helper";
import { BN } from "bn.js";
const buzzingCommand = new Command("buzzing");
import Decimal from "decimal.js";
import {
  ClmmPoolUtil,
  initCetusSDK,
  TickMath,
  adjustForSlippage,
  Percentage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import ora from "ora";

const client = new SuiClient({
  url: getFullnodeUrl(network),
});

const sdk = initCetusSDK({
  network,
});

enum ReportType {
  Yes = "yes",
  No = "no",
}

buzzingCommand
  .command("report-market")
  .requiredOption("-m, --market-id <marketId>", "The market id to report")
  .requiredOption("-r, --report <report>", "report data : yes | no | all")
  .action(async (options: { marketId: string; report: string }) => {
    const signer = getSigner();
    logger.info(`signer: ${signer.toSuiAddress()}`);
    logger.info(`marketId: ${options.marketId}`);

    const market = await getMarket(options.marketId);
    if (!market) {
      logger.error("Market not found");
      return;
    }

    logger.info(`market oracle cap : ${market.oracle_cap}`);

    const oracleCap = await client.getObject({
      id: market.oracle_cap,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    logger.info(`oracleCap: ${JSON.stringify(oracleCap, null, 2)}`);
    const oracleCapOwner = (oracleCap.data?.owner as any).AddressOwner;

    if (oracleCapOwner !== signer.toSuiAddress()) {
      logger.error(
        `Sorry, you are not the owner of the oracle cap, cap owner is ${oracleCapOwner}`
      );
      return;
    }

    logger.info(`market: ${JSON.stringify(market, null, 2)}`);
    logger.info(`report: ${options.report}`);
    let report_data = [];
    if (options.report === ReportType.Yes) {
      logger.info("report yes");
      report_data = [1, 0];
    } else if (options.report === ReportType.No) {
      logger.info("report no");
      report_data = [0, 1];
    } else {
      logger.error("report type is not valid");
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      package: buzzingConfig.package,
      module: "buzzing",
      function: "report_market",
      typeArguments: [market.stake_coin_type],
      arguments: [
        tx.object(market.oracle_cap),
        tx.object(market.market_id),
        tx.pure.vector("u8", report_data),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
    });

    logger.info(`transaction executed: ${result.digest} `);

    const response = await client.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    logger.info(`transaction executed: ${result.digest} `);
    logger.info(`transaction link: ${transactionLink(result.digest)}`);
  });

buzzingCommand
  .command("list-markets")
  .option("-p, --pool", "display pool info", false)
  .action(async (options: { pool: boolean }) => {
    logger.info(`global object: ${buzzingConfig.globalObject}`);

    const global = await client.getObject({
      id: buzzingConfig.globalObject,
      options: {
        showContent: true,
      },
    });

    if (global.data?.content?.dataType === "moveObject") {
      const content = global.data.content.fields as {
        id: { id: string };
        markets: string[];
      };
      console.log("Markets List:");
      for (let i = 0; i < content.markets.length; i++) {
        const marketId = content.markets[i];
        console.log(`--- ${i + 1}. Market ID: ${marketId} ----`);
        const market = await getMarket(marketId);
        console.log(`Market: ${JSON.stringify(market, null, 2)}`);
        if (options.pool) {
          if (market?.token_pools && market?.token_pools.length > 0) {
            const yesPool = await client.getObject({
              id: market?.token_pools[0],
              options: {
                showContent: true,
              },
            });
            logger.info(`yesPool: ${JSON.stringify(yesPool, null, 2)}`);
          } else {
            logger.info("No pool found");
          }
        }
        console.log("\n");
      }
    } else {
      logger.error("Failed to get markets data");
    }
  });

buzzingCommand
  .command("create-market")
  .option(
    "-q, --question <question>",
    "The question of the market",
    "Are you OK?"
  )
  .option(
    "-o, --options-count <options_count>",
    "The options count of the market",
    "2"
  )
  .option(
    "-s, --stake-coin <stake_coin>",
    "The stake coin of the market",
    `${buzzingConfig.package}::stake_token::STAKE_TOKEN`
  )
  .option("-a, --amount <amount>", "stake amount", "100_000_000")
  .action(
    async (options: {
      question: string;
      optionsCount: number;
      stakeCoin: string;
      amount: number;
    }) => {
      const signer = getSigner();

      logger.info(`global object: ${buzzingConfig.globalObject}`);

      const tx = new Transaction();

      let coins;
      if (options.stakeCoin === "0x2::sui::SUI") {
        coins = tx.splitCoins(tx.gas, [options.amount]);
      } else {
        coins = await getCoins(
          tx,
          signer.toSuiAddress(),
          options.stakeCoin,
          options.amount
        );
      }

      tx.moveCall({
        package: buzzingConfig.package,
        module: "buzzing",
        function: "create_market",
        typeArguments: [options.stakeCoin],
        arguments: [
          tx.pure(bcs.string().serialize(options.question)),
          tx.pure(bcs.u8().serialize(options.optionsCount)),
          coins[0],
          tx.object(buzzingConfig.globalObject),
        ],
      });

      const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer,
      });

      logger.info(`transaction executed: ${result.digest} `);

      const response = await client.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (response.effects?.status.status === "success") {
        logger.info("Market created successfully!");
        logger.info(
          `Market ID: ${response.effects.created?.[0]?.reference?.objectId}`
        );
      } else {
        logger.error("Failed to create market");
        logger.error(response.effects?.status);
      }
    }
  );

buzzingCommand
  .command("create-token")
  .description("create ctf tokens for buzzing by market created event")
  .action(async () => {
    const signer = getSigner();
    const adminCap = await getAdminCap(signer.toSuiAddress());
    if (!adminCap) {
      logger.error("You must have a admin cap to create tokens");
      return;
    }

    const fillTime: number = runtime.getData("fillTime");

    if (fillTime) {
      runtime.setData("fillTime", fillTime + 1);
    } else {
      runtime.setData("fillTime", 1);
    }

    try {
      const eventType = `${buzzingConfig.package}::buzzing::EventMarketCreated`;
      logger.info(`eventType: ${eventType}`);
      let hasNextPage = true;
      let nextCursor = runtime.getData("cursor");
      const allEvents = [];

      while (hasNextPage) {
        const marketCreateEvents = await client.queryEvents({
          query: {
            MoveEventType: eventType,
          },
          order: "ascending",
          cursor: nextCursor,
          limit: 1,
        });

        if (marketCreateEvents.data.length > 0) {
          allEvents.push(...marketCreateEvents.data);

          // 检查是否有下一页
          if (marketCreateEvents.hasNextPage && marketCreateEvents.nextCursor) {
            nextCursor = marketCreateEvents.nextCursor;
            runtime.setData("cursor", nextCursor);
          } else {
            hasNextPage = false;
          }

          // 打印事件信息
          marketCreateEvents.data.forEach(async (event) => {
            logger.info("Event Details:");
            logger.info(`  Transaction: ${event.id.txDigest}`);
            // 获取事件的具体字段
            const eventData = event.parsedJson as {
              market_id: string;
            };

            if (eventData) {
              logger.info("  Market Details:");
              logger.info(`  Market ID: ${eventData.market_id}`);

              const market = await getMarket(eventData.market_id);
              logger.info(`market: ${JSON.stringify(market)}`);

              if (market) {
                if (market.status == 0) {
                  logger.info("Let's build the buzzing token with Yea Or No!");

                  const { yesTokenPackageId, yesTokenCoinMedataId } =
                    await publishYesToken(market, 100_000_000);

                  const { noTokenPackageId, noTokenCoinMedataId } =
                    await publishNoToken(market, 100_000_000);

                  logger.info(`yesTokenPackageId: ${yesTokenPackageId}`);
                  logger.info(`yesTokenCoinMedataId: ${yesTokenCoinMedataId}`);
                  logger.info(`noTokenPackageId: ${noTokenPackageId}`);
                  logger.info(`noTokenCoinMedataId: ${noTokenCoinMedataId}`);

                  const yesPoolAddress = await createBuzzingPool(
                    market,
                    yesTokenPackageId,
                    `yes_${market.question_index}`
                  );

                  const noPoolAddress = await createBuzzingPool(
                    market,
                    noTokenPackageId,
                    `no_${market.question_index}`
                  );

                  const tx = new Transaction();

                  tx.moveCall({
                    package: buzzingConfig.package,
                    module: "buzzing",
                    function: "fill_market",
                    typeArguments: [market.stake_coin_type],
                    arguments: [
                      tx.object(adminCap),
                      tx.object(market.market_id),
                      tx.pure.vector("address", [
                        yesTokenCoinMedataId,
                        noTokenCoinMedataId,
                      ]),
                      tx.pure.vector("address", [
                        yesPoolAddress,
                        noPoolAddress,
                      ]),
                    ],
                  });

                  const result = await client.signAndExecuteTransaction({
                    transaction: tx,
                    signer,
                  });

                  logger.info(
                    `fill market transaction executed: ${result.digest} `
                  );
                } else {
                  logger.info("Market is already filled");
                }
              }
            }
          });
        } else {
          hasNextPage = false;
        }
      }

      logger.info(`Total events found: ${allEvents.length}`);
    } catch (error) {
      logger.error("Failed to query events:", error);
    }
  });
buzzingCommand
  .command("swap-token")
  .description("swap token default is buy token")
  .requiredOption("-y, --yes", "Buy yes token", false)
  .requiredOption("-n, --no", "Buy no token", false)
  .option("-a, --amount <amount>", "The amount to buy", "1000")
  .option("--buy", "Buy token", false)
  .option("--sell", "Sell token", false)
  .requiredOption("-m, --market-id <marketId>", "The market id to buy yes")
  .action(
    async (options: {
      marketId: string;
      yes: boolean;
      no: boolean;
      amount: number;
      buy: boolean;
      sell: boolean;
    }) => {
      if (!options.yes && !options.no) {
        logger.error("You must specify either yes or no");
        return;
      }

      if (!options.buy && !options.sell) {
        logger.error("You must specify either buy or sell");
        return;
      }

      let a2b;
      if (options.buy) {
        a2b = false;
      } else {
        a2b = true;
      }

      const signer = getSigner();
      const market = await getMarket(options.marketId);
      if (!market) {
        logger.error("Market not found");
        return;
      }

      let buyPool = market.token_pools[0];
      if (options.no) {
        buyPool = market.token_pools[1];
      }

      sdk.senderAddress = signer.toSuiAddress();
      const slippage = Percentage.fromDecimal(d(5));
      const pool = await sdk.Pool.getPool(buyPool);

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

      // a2b true means input a swap b
      const preSwap: any = await sdk.Swap.preswap({
        pool: pool,
        currentSqrtPrice: pool.current_sqrt_price,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        decimalsA: metadataA.decimals, // coin a 's decimals
        decimalsB: metadataB.decimals, // coin b 's decimals
        a2b: a2b,
        byAmountIn: true, // fix token a amount
        amount: options.amount.toString(),
      });

      logger.info(`preswap: ${JSON.stringify(preSwap, null, 2)}`);

      const toAmount = preSwap.byAmountIn
        ? preSwap.estimatedAmountOut
        : preSwap.estimatedAmountIn;

      const amountLimit = adjustForSlippage(
        new BN(toAmount),
        slippage,
        !preSwap.byAmountIn
      );

      const swapPayload = await sdk.Swap.createSwapTransactionPayload({
        pool_id: pool.poolAddress,
        a2b: a2b,
        by_amount_in: true,
        amount: preSwap.amount.toString(),
        amount_limit: amountLimit.toString(),
        swap_partner: undefined,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
      });

      const swapTxn = await sdk.fullClient.sendTransaction(signer, swapPayload);
      if (swapTxn) {
        logger.info(
          `swapTxn: ${swapTxn?.digest} , ${transactionLink(swapTxn?.digest)}`
        );
      }
    }
  );

buzzingCommand.command("faucet").action(async () => {
  const signer = getSigner();
  const valt = process.env.BUZZING_FAUCET_VALT;
  if (!valt) {
    logger.error("Faucet Valt not found");
    return;
  }
  logger.info(`valt: ${valt}`);

  const tx = new Transaction();

  tx.moveCall({
    package: buzzingConfig.package,
    module: "buzzing_token",
    function: "faucet",
    arguments: [tx.object(valt), tx.pure.u64(100 * 1000_000)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
  });

  logger.info(`transaction executed: ${result.digest} `);

  const response = await client.waitForTransaction({
    digest: result.digest,
    options: {
      showEffects: true,
    },
  });

  logger.info(`transaction executed: ${result.digest} `);
  logger.info(`transaction link: ${transactionLink(result.digest)}`);
});

buzzingCommand
  .command("redeem-token")
  .description("redeem token")
  .requiredOption("-m, --market-id <marketId>", "The market id to redeem token")
  .requiredOption("-v, --valt <valt>", "The valt to redeem token")
  .action(async (options: { marketId: string; valt: string }) => {
    const signer = getSigner();
    const market = await getMarket(options.marketId);
    if (!market) {
      logger.error("Market not found");
      return;
    }

    if (market.status != 2) {
      logger.error("Market is not reported.");
      return;
    }

    if (market.partitions.length == 0) {
      logger.error("Market is not partitioned.");
      return;
    }

    let result = "";
    let rewardMeta = "";
    if (market.partitions[0] == 0 && market.partitions[1] == 1) {
      result = "no";
      rewardMeta = market.token_metas[1];
    }

    if (market.partitions[0] == 1 && market.partitions[1] == 0) {
      result = "yes";
      rewardMeta = market.token_metas[0];
    }

    logger.info(`market result: ${result}`);
    const tokenMeta = await client.getObject({
      id: rewardMeta,
      options: {
        showContent: true,
      },
    });

    const tokenName = (tokenMeta.data?.content as any).fields.name;

    logger.info(`right token is : ${tokenName}`);

    const tokenType = coinMetadataToCoinType(tokenMeta);
    if (!tokenType) {
      logger.error("Token type not found");
      return;
    }

    logger.info(`token type: ${tokenType}`);

    const coins = await client.getCoins({
      owner: signer.toSuiAddress(),
      coinType: tokenType,
    });

    if (coins.data.length == 0) {
      logger.error("You don't have any ${tokenName} tokens");
      return;
    }

    const coinIds = coins.data.map((coin: any) => coin.coinObjectId);
    logger.info(`coinIds: ${coinIds}`);

    const tx = new Transaction();

    const coinPackage = tokenType.split("::")[0];

    if (coinIds.length > 1) {
      tx.mergeCoins(coinIds[0], coinIds.slice(1));
    }

    tx.moveCall({
      package: coinPackage,
      module: tokenName.toLowerCase(),
      function: "redeem_coin",
      typeArguments: [market.stake_coin_type],
      arguments: [
        tx.object(market.market_id),
        tx.object(rewardMeta),
        tx.object(coinIds[0]),
        tx.object(options.valt),
      ],
    });

    const txResult = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
    });

    logger.info(`transaction executed: ${txResult.digest} `);

    const response = await client.waitForTransaction({
      digest: txResult.digest,
      options: {
        showEffects: true,
      },
    });

    logger.info(`transaction executed: ${txResult.digest} `);
    logger.info(`transaction link: ${transactionLink(txResult.digest)}`);
  });

export default buzzingCommand;
