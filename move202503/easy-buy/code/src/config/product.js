export const PRODUCT_CONFIG = {
  name: "Premium Membership",
  description: "Access to exclusive content and features",
  priceUSD: 99.99,
  image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Premium+Membership",
};

export const NETWORK_CONFIG = {
  sui: {
    name: "Sui",
    chainId: "sui:testnet",
    rpcUrl: "https://fullnode.testnet.sui.io",
  },
  solana: {
    name: "Solana",
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  },
  base: {
    name: "Base",
    chainId: 84531,
    rpcUrl: "https://goerli.base.org",
  },
};

// Mock price data (in production, this would come from an API)
export const TOKEN_PRICES = {
  sui: {
    usd: 1.85,
  },
  sol: {
    usd: 180.25,
  },
  eth: {
    usd: 3500.00,
  },
};
