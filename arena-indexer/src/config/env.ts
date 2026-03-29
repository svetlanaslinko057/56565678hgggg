import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  rpcUrl: process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e',
  stableToken: process.env.STABLE_TOKEN || '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948',
  startBlock: parseInt(process.env.START_BLOCK || '0'),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/fomo_arena',
  chainId: parseInt(process.env.CHAIN_ID || '97'),
  confirmations: parseInt(process.env.CONFIRMATIONS || '6'),
};

export const BSC_TESTNET = {
  chainId: 97,
  name: 'BSC Testnet',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  blockExplorer: 'https://testnet.bscscan.com',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
};
