/**
 * Walrus存储服务配置
 */

import { NetworkName } from './config';
import { WALRUS_URLS, WAL_COIN_TYPES as CONSTANT_WAL_COIN_TYPES } from './constants';

/**
 * Walrus网络聚合器URL配置
 */
export const WALRUS_AGGREGATOR_URLS: Record<NetworkName, string> = {
  mainnet: WALRUS_URLS.MAINNET_AGGREGATOR_URL,
  testnet: WALRUS_URLS.TESTNET_AGGREGATOR_URL
};

/**
 * WAL代币类型配置
 */
export const WAL_COIN_TYPES: Record<NetworkName, string> = {
  mainnet: CONSTANT_WAL_COIN_TYPES.MAINNET,
  testnet: CONSTANT_WAL_COIN_TYPES.TESTNET
};

/**
 * 不同环境的epoch时长（秒）
 */
export const EPOCH_DURATION: Record<NetworkName, number> = {
  testnet: 24 * 60 * 60,      // 测试网：1天
  mainnet: 14 * 24 * 60 * 60  // 主网：2周
};

/**
 * Walrus服务配置
 */
export const WALRUS_CONFIG = {
  /**
   * 请求重试次数
   */
  MAX_RETRIES: 3,

  /**
   * 重试间隔时间（毫秒）
   */
  RETRY_DELAY: 1000,

  /**
   * 请求超时时间（毫秒）
   */
  REQUEST_TIMEOUT: 60_000,

  /**
   * Walrus WASM CDN URL
   */
  WASM_URL: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',

  /**
   * 默认存储时长（天）
   */
  DEFAULT_LEASE_DAYS: 30,

  /**
   * Walrus环境
   * 可通过环境变量REACT_APP_WALRUS_ENVIRONMENT指定
   */
  ENVIRONMENT: (process.env.REACT_APP_WALRUS_ENVIRONMENT || 'testnet') as NetworkName
};

/**
 * 根据网络环境获取Walrus聚合器URL
 * @param network 网络环境
 * @returns 聚合器URL
 */
export function getWalrusAggregatorUrl(network: NetworkName): string {
  return WALRUS_AGGREGATOR_URLS[network];
}

/**
 * 获取当前环境的WAL代币类型
 * @returns WAL代币类型
 */
export function getWalCoinType(): string {
  return WAL_COIN_TYPES[WALRUS_CONFIG.ENVIRONMENT];
}

/**
 * 获取当前环境的epoch时长（秒）
 * @returns epoch时长（秒）
 */
export function getEpochDuration(): number {
  return EPOCH_DURATION[WALRUS_CONFIG.ENVIRONMENT];
}