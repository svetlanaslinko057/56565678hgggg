// Contract addresses configuration
// Network: BSC Testnet (Binance Smart Chain)

export const CONTRACTS = {
  // StablePredictionMarketNFT contract address
  MARKET_ADDRESS: '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e',
  
  // Stablecoin (USDT/USDC) contract address
  STABLE_TOKEN: '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948',
} as const;

// Chain configuration - BSC Testnet
export const CHAIN_CONFIG = {
  chainId: 97, // BSC Testnet
  chainName: 'BSC Testnet',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  blockExplorer: 'https://testnet.bscscan.com',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
} as const;

// Market status labels
export const MARKET_STATUS_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'Locked',
  2: 'Resolved',
  3: 'Disputed',
  4: 'Cancelled',
};

// Market status colors
export const MARKET_STATUS_COLORS: Record<number, string> = {
  0: '#10B981', // green - open
  1: '#F59E0B', // yellow - locked
  2: '#6366F1', // purple - resolved
  3: '#EF4444', // red - disputed
  4: '#6B7280', // gray - cancelled
};
