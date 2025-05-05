import { Command } from "commander";
import { logger, network } from "../config";
import { initCetusSDK } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { getSigner } from "../tools";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { transactionLink } from "../tools/helper";

const accountCommand = new Command("account").description("account command");

const signer = getSigner();

const cetusClmmSDK = initCetusSDK({ network: network });

accountCommand
  .command("info")
  .description("load account info")
  .action(async () => {
    console.log(`current address: ${signer.toSuiAddress()}`);
  });

accountCommand
  .command("balance")
  .description("load coin balance")
  .action(async () => {
    console.log(`current address: ${signer.toSuiAddress()}`);
    const rpc = cetusClmmSDK.fullClient;
    const balances = await rpc.getAllBalances({
      owner: signer.toSuiAddress(),
    });

    const lines: any[] = [];

    await Promise.all(
      balances.map(async (balance) => {
        const meta = await rpc.getCoinMetadata({
          coinType: balance.coinType,
        });

        lines.push({
          metaName: meta?.name,
          balance: balance.totalBalance,
          decimal: meta?.decimals,
          humanBalance:
            Number(balance.totalBalance) / 10 ** (meta?.decimals ?? 0),
          coinType: balance.coinType,
        });
      })
    );

    console.table(lines);
  });

accountCommand
  .command("transfer")
  .requiredOption("-t, --to <to>", "The recipient address")
  .requiredOption("-a, --amount <amount>", "The amount to transfer")
  .requiredOption("-c, --coin-type <coin-type>", "The coin type")
  .description("transfer coin")
  .action(async (options: { to: string; amount: number; coinType: string }) => {
    const client = new SuiClient({ url: getFullnodeUrl(network) });
    const coins = await client.getCoins({
      owner: signer.toSuiAddress(),
      coinType: options.coinType,
    });

    const coinAddresses = coins.data.map((coin) => coin.coinObjectId);

    const tx = new Transaction();
    if (coinAddresses.length > 1) {
      tx.mergeCoins(coinAddresses[0], coinAddresses.slice(1));
    }

    const [coin] = tx.splitCoins(coinAddresses[0], [options.amount]);
    tx.transferObjects([coin], options.to);

    const txn = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
    });

    await client.waitForTransaction({
      digest: txn.digest,
    });

    logger.info(`transfer transaction: ${txn.digest} success`);
    logger.info(`transaction link : ${transactionLink(txn.digest)}`);
  });

export default accountCommand;
