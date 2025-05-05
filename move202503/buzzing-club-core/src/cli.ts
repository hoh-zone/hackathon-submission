#!/usr/bin/env node

import { Command } from "commander";
import { getSuiPath } from "./tools/helper";
import { logger, paths, ensureDirectories, isDevelopment } from "./config";
import {
  handleNewPackage,
  handleBuildPackage,
  handlePublishPackage,
  handleUpgradePackage,
} from "./commands/package";
import { handleNewToken } from "./commands/token";

import accountCommand from "./commands/account";
import buzzingCommand from "./commands/buzzing";
import { runtime } from "./runtime";
import testCommand from "./commands/test";

runtime.init();

// Check for sui installation
if (!isDevelopment) {
  const suiPath = getSuiPath();
  if (!suiPath) {
    logger.error(
      "sui not found, please install sui first, https://docs.sui.io/guides/developer/getting-started/sui-install"
    );
    process.exit(1);
  }
}

// Ensure required directories exist
ensureDirectories();

const program = new Command();

program.version("1.0.0").option("-s, --start-path <path>", "move start path");

program
  .command("new-package")
  .option("-n, --name <name>", "move package name")
  .description("create a move package")
  .usage("new-package --name <name>")
  .action(async (options) => {
    try {
      logger.info("new-package", options);
      await handleNewPackage(options, paths.start);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("build")
  .description("build move project")
  .option("-p, --package <package>", "move package name")
  .action(async (options) => {
    try {
      await handleBuildPackage(options, paths.start);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("publish")
  .option("-p, --package <package>", "move package name")
  .option("-b, --build", "build move project before publish")
  .description("publish move project")
  .action(async (options) => {
    try {
      await handlePublishPackage(options, paths.start);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("upgrade")
  .option("-p, --package <package>", "move package name")
  .option("-b, --build", "build move project before upgrade")
  .description("upgrade move project")
  .action(async (options) => {
    try {
      await handleUpgradePackage(options, paths.start);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("new-token")
  .description("new token")
  .option("-n, --name <name>", "token name")
  .option("-d, --decimals <number>", "token decimals")
  .option("-i, --initialSupply <number>", "token initial supply")
  .option("-p, --package <package>", "move package name")
  .option("--token-symbol <tokenSymbol>", "token symbol")
  .action(async (options) => {
    try {
      await handleNewToken(options, paths.start);
    } catch (error) {
      process.exit(1);
    }
  });

program.addCommand(accountCommand);
program.addCommand(buzzingCommand);
program.addCommand(testCommand);

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
  process.exit(1);
});

program.parse(process.argv);
