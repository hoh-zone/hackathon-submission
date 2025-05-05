/**
 * 应用常量配置
 * 这些配置在测试环境和生产环境中保持不变
 */

/**
 * 合约模块名称
 * 这是合约的模块名，在所有环境中都是相同的
 */
export const MODULE_NAME = 'nft_billboard';

/**
 * Sui Clock对象ID
 * 这是Sui链上的全局时钟对象，ID在所有环境中都是0x6
 */
export const CLOCK_ID = '0x6';

/**
 * Walrus存储服务配置
 */
export const WALRUS_URLS = {
  /**
   * 主网Walrus聚合器URL
   */
  MAINNET_AGGREGATOR_URL: 'https://walrus.globalstake.io/v1/blobs/by-object-id/',

  /**
   * 测试网Walrus聚合器URL
   */
  TESTNET_AGGREGATOR_URL: 'https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/'
};

/**
 * WAL代币类型配置
 */
export const WAL_COIN_TYPES = {
  /**
   * 主网WAL代币类型
   */
  MAINNET: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',

  /**
   * 测试网WAL代币类型
   */
  TESTNET: '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL'
};
