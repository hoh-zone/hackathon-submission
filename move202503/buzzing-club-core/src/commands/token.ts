import { TokenOptions } from "./types";
import { logger, validateRequiredParams, validateNumber } from "../config";
import { spinner } from "../config/spinner";
import { newToken as createNewToken } from "../tools/helper";

export async function handleNewToken(
  options: TokenOptions,
  startPath: string
): Promise<void> {
  try {
    spinner.start("Validating token parameters...");

    // Validate required parameters
    validateRequiredParams(
      {
        name: options.name,
        decimals: options.decimals,
        initialSupply: options.initialSupply,
        tokenSymbol: options.tokenSymbol,
      },
      ["name", "decimals", "initialSupply", "tokenSymbol"]
    );

    // Validate numeric parameters
    validateNumber(options.decimals, "decimals", { min: 0 });
    validateNumber(options.initialSupply, "initialSupply", { min: 1 });

    spinner.update("Creating new token...");
    logger.info("Token parameters:", {
      name: options.name,
      decimals: options.decimals,
      initialSupply: options.initialSupply,
      tokenSymbol: options.tokenSymbol,
    });

    await createNewToken(
      {
        name: options.name,
        symbol: options.tokenSymbol,
        decimals: options.decimals,
        initialSupply: options.initialSupply,
        base64Icon: "",
      },
      startPath
    );

    spinner.succeed("Successfully created new token");
  } catch (error) {
    spinner.fail("Failed to create new token");
    logger.error("Error details:", error);
    throw error;
  }
}
