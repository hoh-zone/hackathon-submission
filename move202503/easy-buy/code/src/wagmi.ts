import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';
import { defineChain } from 'viem';

export const bscTestnet = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Multichain payment demo',
  projectId: 'YOUR_PROJECT_ID',
  chains: [bscTestnet, mainnet, polygon, optimism, arbitrum, base],
});
