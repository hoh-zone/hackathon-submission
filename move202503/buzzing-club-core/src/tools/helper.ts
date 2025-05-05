import path from "path";
import { execSync } from "child_process";
import fs from "fs";
import { buildMoveToml } from "./tomlBuilder";
import { buildMoveCode } from "./moveCodeBuilder";
import { network } from "../config";
import { CoinMetadata } from "@mysten/sui/dist/cjs/client";
interface UpgradeInfo {
  digest: string;
  objectChanges: [
    {
      type: string;
      sender: string;
      owner: {
        AddressOwner: string;
      };
    }
  ];
}

interface DeployInfo {
  digest: string;
  objectChanges: [
    {
      type: string;
      sender: string;
      owner: {
        AddressOwner: string;
      };
      objectType: string;
      objectId: string;
      version: string;
      previousVersion: string;
      digest: string;
      modules: string[];
      packageId: string;
    }
  ];
}

interface PublishInfo {
  type: string;
  packageId: string;
  version: string;
  digest: string;
  modules: string[];
}

export const buildMove = async (packagePath: string) => {
  console.log("build move package: ", packagePath);
  execSync(`sui move build --skip-fetch-latest-git-deps`, {
    cwd: packagePath,
    stdio: "inherit",
  });
};

export const buildMoveAsJson = async (buildPath: string) => {
  const p = buildPath;
  const output = execSync(
    `sui move build --path ${p} --dump-bytecode-as-base64 --skip-fetch-latest-git-deps`,
    {
      cwd: p,
      stdio: "pipe",
    }
  );
  fs.writeFileSync(path.join(p, "build.json"), output);
};

export const publishNew = async (packagePath: string) => {
  const output = execSync(
    `sui client publish --gas-budget 100000000 --skip-dependency-verification --json`,
    {
      cwd: packagePath,
      stdio: "pipe", // capture all output
    }
  );
  if (output) {
    const outputStr = output.toString();
    console.log("Publishing output:", outputStr);
    fs.writeFileSync(path.join(packagePath, "deploy.json"), outputStr);
  }
};

export const getGlobalObject = (deploy: DeployInfo) => {
  const info = deploy.objectChanges.filter(
    (change) =>
      change.type === "created" &&
      change.objectType.endsWith("::buzzing::Global")
  )[0];
  return {
    packageId: info.packageId,
    version: info.version,
    digest: info.digest,
    modules: info.modules,
    objectId: info.objectId,
  };
};

export const getFaucetValt = (deploy: DeployInfo) => {
  const info = deploy.objectChanges.filter(
    (change) =>
      change.type === "created" &&
      change.objectType.endsWith("::buzzing_token::Valt")
  )[0];
  return {
    packageId: info.packageId,
    version: info.version,
    digest: info.digest,
    modules: info.modules,
    objectId: info.objectId,
  };
};

export const getPublishedPackage = (deploy: DeployInfo) => {
  const info = deploy.objectChanges.filter(
    (change) => change.type === "published"
  )[0];
  return {
    packageId: info.packageId,
    version: info.version,
    digest: info.digest,
    modules: info.modules,
  };
};

export const getUpdateCap = (deploy: DeployInfo) => {
  const info = getPublishedPackage(deploy);
  const packageId = info.packageId;
  const updateCap = deploy.objectChanges.filter(
    (change) =>
      change.type === "created" &&
      change.objectType === "0x2::package::UpgradeCap"
  )[0];
  return {
    packageId,
    updateCap,
  };
};

export const upgradeCurrent = async (packagePath: string) => {
  const deploy = JSON.parse(
    fs.readFileSync(path.join(packagePath, "deploy.json"), "utf-8")
  ) as DeployInfo;
  const info = getUpdateCap(deploy);

  console.log(`update cap : ${JSON.stringify(info.updateCap)}`);

  try {
    const output = execSync(
      `sui client upgrade --gas-budget 100000000 --upgrade-capability ${info.updateCap.objectId} --skip-dependency-verification --json`, // Redirect stderr to stdout
      {
        cwd: packagePath,
        stdio: "pipe",
      }
    );

    if (output) {
      const outputStr = output.toString();
      console.log("Upgrade output:", outputStr);
      fs.writeFileSync(path.join(packagePath, "upgrade.json"), outputStr);
    } else {
      console.log("No output received from upgrade command");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during upgrade:", error.message);
      // Try to extract JSON from error output if available
      const errorOutput = error.message || "";
      const jsonMatch = errorOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log("Found JSON in error output");
        fs.writeFileSync(path.join(packagePath, "upgrade.json"), jsonStr);
      }
    }
    throw error;
  }
};

export const getUpgradeInfo = (packagePath: string) => {
  const upgrade = JSON.parse(
    fs.readFileSync(path.join(packagePath, "upgrade.json"), "utf-8")
  ) as UpgradeInfo;
  return upgrade;
};

export interface NewTokenOptions {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  base64Icon?: string;
}

export const newToken = async (options: NewTokenOptions, startPath: string) => {
  console.log(`You will create new token: ${JSON.stringify(options)}`);

  execSync(`sui move new ${options.name.toLowerCase()}`, {
    cwd: startPath,
    stdio: "inherit",
  });
  const tokenPath = path.join(startPath, options.name.toLowerCase());

  const moveToml = buildMoveToml(options.name.toLowerCase());
  fs.writeFileSync(path.join(tokenPath, "Move.toml"), moveToml);

  const newTokenMoveCode = buildMoveCode(options);

  fs.writeFileSync(
    path.join(tokenPath, `sources/${options.name.toLowerCase()}.move`),
    newTokenMoveCode
  );

  await buildMove(tokenPath);
  await publishNew(tokenPath);

  // analyze the deploy json and get the package id
  const deploy = getDeployInfo(tokenPath);
  const packageId = getPublishedPackage(deploy).packageId;
  const coinMedataId = getCoinMedataId(deploy);
  return {
    packageId,
    coinMedataId,
  };
};

const getCoinMedataId = (deploy: DeployInfo) => {
  const info = deploy.objectChanges.filter(
    (change) =>
      change.type === "created" &&
      change.objectType.startsWith("0x2::coin::CoinMetadata")
  )[0];
  return info.objectId;
};

export const getDeployInfo = (packagePath: string) => {
  const deploy = JSON.parse(
    fs.readFileSync(path.join(packagePath, "deploy.json"), "utf-8")
  ) as DeployInfo;
  return deploy;
};

export const newPackage = async (packageName: string, startPath: string) => {
  console.log(
    `You will create new move package: ${packageName} ,path is ${startPath}/${packageName}`
  );
  execSync(`sui move new ${packageName}`, {
    cwd: startPath,
    stdio: "inherit",
  });
};

export const getSuiPath = () => {
  try {
    const output = execSync("which sui", { stdio: "pipe" });
    return output.toString().trim();
  } catch (error) {
    return null;
  }
};

export const transactionLink = (txHash: string) => {
  if (network === "mainnet") {
    return `https://suivision.xyz/txblock/${txHash}`;
  } else {
    return `https://testnet.suivision.xyz/txblock/${txHash}`;
  }
};

export const coinMetadataToCoinType = (metadata: any) => {
  const metaType = metadata.data.content.type;
  const regex = /<([^>]+)>/;
  let m;

  if ((m = regex.exec(metaType)) !== null) {
    // The result can be accessed through the `m`-variable.
    return m[1];
  }
  return null;
};
