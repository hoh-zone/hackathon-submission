export const DEVNET_COUNTER_PACKAGE_ID = "0x28fba8eacff689870615901a5204b7758ffe71835808f8fbaac494f35d225e38";
export const TESTNET_COUNTER_PACKAGE_ID = "0x28fba8eacff689870615901a5204b7758ffe71835808f8fbaac494f35d225e38";
export const MAINNET_COUNTER_PACKAGE_ID = "0x28fba8eacff689870615901a5204b7758ffe71835808f8fbaac494f35d225e38";

// // 新部署的合约配置
// export const CONTRACT_CONFIG = {
//   PACKAGE_ID: "0xd3b528bf04e77b0f9842431799387cb8cdbe329fc03fcb648ff32634d673ddbb",
//   TEST_BTC: {
//     METADATA_ID: "0xe18990c3a0c37108941c62369d86da4399cb770e4a5d09305cca239c991e6a59",
//     MINT_CAP_ID: "0x21682827efd2b384fcecc506e1fbfa2b5c60e26fa21b5463cce83df1e2443c51",
//     MODULE: "test_btc",
//     SYMBOL: "testBTC",
//     DECIMALS: 6
//   },
//   TEST_SUI: {
//     METADATA_ID: "0x55546cfebcebdc041d215cd4149bb7e121d844ca3ba543b7c004ffbf516f896b",
//     MINT_CAP_ID: "0x1c5d82edca77a3c80837aaeb638018bb50adc4742d947d75cc8b672938b5cbbb",
//     MODULE: "test_sui",
//     SYMBOL: "testSUI",
//     DECIMALS: 6
//   },
//   SWAP: {
//     MODULE: "move_swap",
//     FEE_PERCENT: 30, // 0.3% 费率
//     FUNCTIONS: {
//       CREATE_POOL: "create_pool",
//       ADD_LIQUIDITY: "add_liquidity",
//       REMOVE_LIQUIDITY: "remove_liquidity_entry",
//       SWAP: "swap",
//       SWAP_REVERSE: "swap_reverse"
//     }
//   },
//   UPGRADE_CAP_ID: "0x8aed6b0e33fb15e04af2ce20ad0982ee441b628c3cfd830d6c8a93d8fa6877a4"
// };

// 升级权限ID
// export const UPGRADE_CAP_ID = "0x8eaa02c6f2c0cbb27fda7cc6b9911dfa685d3508049273f54237655d852e7fc5";

// 其他网络配置
export const NETWORK_RPC_URLS = {
  devnet: "https://fullnode.devnet.sui.io",
  testnet: "https://fullnode.testnet.sui.io",
  mainnet: "https://fullnode.mainnet.sui.io"
};

// 网络浏览器配置
export const NETWORK_EXPLORERS = {
  devnet: "https://suiexplorer.com/?network=devnet",
  testnet: "https://suiexplorer.com/?network=testnet",
  mainnet: "https://suiexplorer.com"
};

// 网络环境配置
export const NETWORK_ENV = {
  DEVNET: "devnet",
  TESTNET: "testnet", 
  MAINNET: "mainnet"
} as const;

// 默认网络
export const DEFAULT_NETWORK = NETWORK_ENV.TESTNET;
