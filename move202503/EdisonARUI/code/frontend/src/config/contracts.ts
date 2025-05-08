/**
 * HashCAT智能合约配置
 * 包含部署在Sui测试网上的各种合约地址与基本配置信息
 */

export const COMMON_CONTRACT = {  
  CLOCK: "0x6",
  RANDOM_NUMBER_GENERATOR: "0x7"
}
// 测试代币合约配置
export const TEST_TOKENS_CONTRACT = {
  PACKAGE_ID: "0xcbc842eb9ab052ca43a54d8576ba0b5225f761312a2ef0b828720e46b366b08c",
  TEST_BTC: {
    METADATA_ID: "0xdff5ba6bc703534e5a9f3e99ab35cb2005a9ea403003d21a4140bfd1c1a5eda4",
    MINT_CAP_ID: "0xd347cf88fb1b658b1dc19f4006f4019de7e937906d96fb5907e331110e65f4aa",
    MODULE: "test_btc",
    SYMBOL: "TEST_BTC",
    DECIMALS: 6,
    COIN_TYPE: "0xcbc842eb9ab052ca43a54d8576ba0b5225f761312a2ef0b828720e46b366b08c::test_btc::TEST_BTC"
  },
  TEST_SUI: {
    METADATA_ID: "0x0a9b0d1cecfc11630a23271ab973a2b7f763c4c5767e48914b6832c4ff1951e4",
    MINT_CAP_ID: "0x8f716d56de4206576f1543f64fecbe566eaf93d35624b986b0753488ed3e323b",
    MODULE: "test_sui",
    SYMBOL: "TEST_SUI",
    DECIMALS: 6,
    COIN_TYPE: "0xcbc842eb9ab052ca43a54d8576ba0b5225f761312a2ef0b828720e46b366b08c::test_sui::TEST_SUI"
  },
  UPGRADE_CAP_ID: "0x13444172fcf34637d81d781fc8b4041d21e637d37c53e88913261e4b92403de9"
};

// SWAP合约配置
export const SWAP_CONTRACT = {
  PACKAGE_ID: "0x3fcb8ffa7daf76e8ebcff614db0a2dc73d5bfc4059da4c2cab3e85dfe4e3c7f3",
  TEST_BTC: {
    METADATA_ID: "0xe18990c3a0c37108941c62369d86da4399cb770e4a5d09305cca239c991e6a59",
    MINT_CAP_ID: "0x21682827efd2b384fcecc506e1fbfa2b5c60e26fa21b5463cce83df1e2443c51",
    MODULE: "test_btc",
    SYMBOL: "testBTC",
    DECIMALS: 6,
    COIN_TYPE: "0xd3b528bf04e77b0f9842431799387cb8cdbe329fc03fcb648ff32634d673ddbb::test_btc::TEST_BTC"
  },
  TEST_SUI: {
    METADATA_ID: "0x55546cfebcebdc041d215cd4149bb7e121d844ca3ba543b7c004ffbf516f896b",
    MINT_CAP_ID: "0x1c5d82edca77a3c80837aaeb638018bb50adc4742d947d75cc8b672938b5cbbb",
    MODULE: "test_sui",
    SYMBOL: "testSUI",
    DECIMALS: 6,
    COIN_TYPE: "0xd3b528bf04e77b0f9842431799387cb8cdbe329fc03fcb648ff32634d673ddbb::test_sui::TEST_SUI"
  },
  SWAP: {
    MODULE: "move_swap",
    FEE_PERCENT: 30, // 0.3% 费率
    FUNCTIONS: {
      CREATE_POOL: "create_pool",
      ADD_LIQUIDITY: "add_liquidity",
      REMOVE_LIQUIDITY: "remove_liquidity_entry",
      SWAP: "swap",
      SWAP_REVERSE: "swap_reverse"
    }
  },
  UPGRADE_CAP_ID: "0x6bfc3e9ab9414731e6efacea2543513ef0e1400795152df9489ac1820c24b1fb"
};

// 保险合约配置
export const INSURANCE_CONTRACT = {
  PACKAGE_ID: "0x05183e162f06e7544a050619766660fd78544d1449ad64db8b91eee3634a1a03", // 保险合约地址
  INSURANCE: {
    MODULE: "insurance",
    FUNCTIONS: {
      CREATE_POLICY: "mint_insurance",
      CLAIM: "claim",
      REDEEM: "redeem",
      UPDATE_BASE_RATE: "update_base_rate",
      UPDATE_VOLATILITY: "update_volatility"
    }
  },
  INSURANCE_NFT: {
    MODULE: "insurance_nft",
    FUNCTIONS: {
      MINT: "mint"
    }
  },
  POLICY_MANAGER_ID: "0xcea4b3dd911bc8541a71273029613f0c54bb1a4042f8d2972677c5eac3eb6d7c", // PolicyManager对象ID
  ADMIN_CAP_ID: "0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc", // 管理员地址
  UPGRADE_CAP_ID: "0x0cae252ff41b66f67c317375c3e902c3666a67e9b143a251c480ba6c8448754b", // 升级权限ID
  // 资金池对象和权限
  FINANCE_POOL_ID: "0x0ade79ff8ca2fbff17da7711e89ee526c5344815c480826686da9d896f1d52eb", // FinancePool对象ID
  INSURANCE_CAP_ID: "0x49939fb29bd049f5262f6c95e3042c8db7d396a5185a60cbfc9984a228acde97" // InsuranceCapability对象ID
};

// 债券合约配置
export const BOND_CONTRACT = {
  PACKAGE_ID: "0x51726d9454c6e8a65424e92ebb5f6137bab935c5a9ce941eb2a380035685e537", // 债券合约地址
  BOND_POOL_ID: "0xfbff0f4f2502546fbd446577e318c452378ca51f6d854c07745dd7b06ae18c04", // BondPool对象ID
  UPGRADE_CAP_ID: "0x5e984dec3c745692f25edf278f6efa71c85d27cc2be998408fe5e39a9097c21f", // 升级权限ID
  MODULE: "bond_pkg",
  FUNCTIONS: {
    PURCHASE_BOND: "purchase_bond",
    REDEEM_BOND: "redeem_bond",
    UPDATE_APY: "update_apy"
  }
};

// 基金合约配置
export const FUND_CONTRACT = {
  PACKAGE_ID: "0xb06eebfd464eb39734a984d9f2df2a32fe852a63aec77a0ca7518a6eaa6d2f65", // 基金合约地址
  FINANCE_POOL_ID: "0x0ade79ff8ca2fbff17da7711e89ee526c5344815c480826686da9d896f1d52eb", // FinancePool对象ID
  INSURANCE_CAP_ID: "0x49939fb29bd049f5262f6c95e3042c8db7d396a5185a60cbfc9984a228acde97", // InsuranceCapability对象ID
  BOND_CAP_ID: "0x2803bc4e7f9da724a8b92421da2219be3cbf39380675fcf082e332103bb72c9c", // BondCapability对象ID
  UPGRADE_CAP_ID: "0xe5e140f63403ce400133c88cead473f14169b949c9b8650cd0dbd7001d1da897", // 升级权限ID
  MODULE: "fund",
  FUNCTIONS: {
    DEPOSIT: "deposit",
    WITHDRAW: "withdraw",
    GET_STATS: "get_stats"
  }
};

// 网络配置
export const NETWORK_CONFIG = {
  RPC_URLS: {
    devnet: "https://fullnode.devnet.sui.io",
    testnet: "https://fullnode.testnet.sui.io",
    mainnet: "https://fullnode.mainnet.sui.io"
  },
  EXPLORERS: {
    devnet: "https://suiexplorer.com/?network=devnet",
    testnet: "https://suiexplorer.com/?network=testnet",
    mainnet: "https://suiexplorer.com"
  },
  ENV: {
    DEVNET: "devnet",
    TESTNET: "testnet", 
    MAINNET: "mainnet"
  },
  DEFAULT: "testnet" // 默认使用测试网
}; 