import { SWAP_CONTRACT, TEST_TOKENS_CONTRACT } from './contracts';

export enum TokenSymbol {
  BTC = 'BTC',
  SBTC = 'sBTC',
  TEST_BTC = 'TEST_BTC',
  SUI = 'SUI',
  SWAP_BTC = 'swapBTC',
  SWAP_SUI = 'swapSUI',
}

export interface Token {
  symbol: TokenSymbol;
  name: string;
  chain: string;
  icon: 'BTC' | 'SUI' | 'sBTC' | 'TEST_BTC';
  address?: string;
  decimals?: number;
  coinType?: string;
}

export const TOKENS: Token[] = [
  {
    symbol: TokenSymbol.BTC,
    name: 'Bitcoin',
    chain: 'Bitcoin',
    icon: 'BTC',
  },
  {
    symbol: TokenSymbol.SBTC,
    name: 'Synthetic Bitcoin',
    chain: 'Sui',
    icon: 'BTC',
    address: TEST_TOKENS_CONTRACT.TEST_BTC.METADATA_ID,
    decimals: TEST_TOKENS_CONTRACT.TEST_BTC.DECIMALS,
    coinType: TEST_TOKENS_CONTRACT.TEST_BTC.COIN_TYPE,
  },
  {
    symbol: TokenSymbol.TEST_BTC,
    name: 'Synthetic Bitcoin',
    chain: 'Sui',
    icon: 'BTC',
    address: TEST_TOKENS_CONTRACT.TEST_BTC.METADATA_ID,
    decimals: TEST_TOKENS_CONTRACT.TEST_BTC.DECIMALS,
    coinType: TEST_TOKENS_CONTRACT.TEST_BTC.COIN_TYPE,
  },
  {
    symbol: TokenSymbol.SUI,
    name: 'Sui',
    chain: 'Sui',
    icon: 'SUI',
    address: TEST_TOKENS_CONTRACT.TEST_SUI.METADATA_ID,
    decimals: TEST_TOKENS_CONTRACT.TEST_SUI.DECIMALS,
    coinType: TEST_TOKENS_CONTRACT.TEST_SUI.COIN_TYPE,
  },
  // SWAP合约代币
  {
    symbol: TokenSymbol.SWAP_BTC,
    name: 'Swap Bitcoin Token',
    chain: 'Sui',
    icon: 'BTC',
    address: SWAP_CONTRACT.TEST_BTC.METADATA_ID,
    decimals: SWAP_CONTRACT.TEST_BTC.DECIMALS,
    coinType: SWAP_CONTRACT.TEST_BTC.COIN_TYPE,
  },
  {
    symbol: TokenSymbol.SWAP_SUI,
    name: 'Swap Sui Token',
    chain: 'Sui',
    icon: 'SUI',
    address: SWAP_CONTRACT.TEST_SUI.METADATA_ID,
    decimals: SWAP_CONTRACT.TEST_SUI.DECIMALS,
    coinType: SWAP_CONTRACT.TEST_SUI.COIN_TYPE,
  },
];

// Swap mode only allows Sui chain tokens
export const SWAP_TOKENS = TOKENS.filter(token => 
  token.chain === 'Sui' && 
  token.symbol.startsWith('swap')
);

// Bridge pairs configuration
export const BRIDGE_PAIRS = [
  {
    from: TOKENS.find(t => t.symbol === 'BTC')!,
    to: TOKENS.find(t => t.symbol === 'sBTC')!,
  },
  {
    from: TOKENS.find(t => t.symbol === 'BTC')!,
    to: TOKENS.find(t => t.symbol === 'SUI')!,
  },
]; 