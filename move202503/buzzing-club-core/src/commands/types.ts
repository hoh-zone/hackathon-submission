export interface TokenOptions {
  name: string;
  decimals: number;
  initialSupply: number;
  tokenSymbol: string;
}

export interface PackageOptions {
  name: string;
  path?: string;
}

export interface BuildOptions {
  package: string;
}

export interface PublishOptions extends BuildOptions {
  build?: boolean;
}

export interface UpgradeOptions extends BuildOptions {
  build?: boolean;
}
