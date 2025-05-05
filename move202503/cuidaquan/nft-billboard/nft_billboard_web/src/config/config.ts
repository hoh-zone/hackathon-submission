import { getFullnodeUrl } from '@mysten/sui/client';
import { CLOCK_ID, MODULE_NAME } from './constants';

/**
 * 支持的网络类型定义
 * - mainnet: Sui主网
 * - testnet: Sui测试网
 */
export type NetworkName = 'mainnet' | 'testnet';

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  name: string;
  fullNodeUrl: string;
  faucetUrl?: string;
  explorerUrl: string;
}

/**
 * 网络配置对象
 * 包含了不同网络的连接信息
 */
export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  mainnet: {
    name: '主网',
    fullNodeUrl: getFullnodeUrl('mainnet'),
    explorerUrl: 'https://suivision.xyz'
  },
  testnet: {
    name: '测试网',
    fullNodeUrl: getFullnodeUrl('testnet'),
    faucetUrl: 'https://faucet.testnet.sui.io',
    explorerUrl: 'https://testnet.suivision.xyz'
  }
};

/**
 * 默认网络设置
 * 可通过环境变量 REACT_APP_DEFAULT_NETWORK 修改
 */
export const DEFAULT_NETWORK: NetworkName =
  (process.env.REACT_APP_DEFAULT_NETWORK as NetworkName) || 'testnet';

/**
 * 合约配置
 * 包含了合约的关键参数
 */
export const CONTRACT_CONFIG = {
  /**
   * 合约包ID
   * 可通过环境变量 REACT_APP_CONTRACT_PACKAGE_ID 修改
   */
  PACKAGE_ID: process.env.REACT_APP_CONTRACT_PACKAGE_ID || '0x123...',

  /**
   * 合约模块名称
   * 这是一个常量，在所有环境中都是相同的
   */
  MODULE_NAME: MODULE_NAME,

  /**
   * 广告位工厂对象ID
   * 可通过环境变量 REACT_APP_FACTORY_OBJECT_ID 修改
   */
  FACTORY_OBJECT_ID: process.env.REACT_APP_FACTORY_OBJECT_ID || '0x123...',

  /**
   * Clock对象ID
   * 这是一个常量，在所有环境中都是相同的
   */
  CLOCK_ID: CLOCK_ID,
};

/**
 * API配置
 * 包含API相关的配置参数
 */
export const API_CONFIG = {
  /**
   * API请求超时时间（毫秒）
   */
  TIMEOUT: Number(process.env.REACT_APP_API_TIMEOUT || 30000),
};

/**
 * 是否使用模拟数据
 * 开发阶段可以设置为true，使用模拟数据而不是实际调用链上合约
 */
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';