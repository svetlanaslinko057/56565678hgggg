import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default () => ({
  port: parseInt(process.env.PORT || '8001', 10),
  mongo: {
    uri: process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/arena',
  },
  chain: {
    rpc: process.env.CHAIN_RPC || 'https://bsc-testnet.publicnode.com',
    id: parseInt(process.env.CHAIN_ID || '97', 10),
    contract: process.env.PREDICTION_CONTRACT || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'arena-secret',
  },
  // On-chain mode configuration
  arena: {
    onchainEnabled: process.env.ARENA_ONCHAIN_ENABLED === 'true',
    coreAddress: process.env.ARENA_CORE_ADDRESS || '',
    positionNftAddress: process.env.ARENA_POSITION_NFT_ADDRESS || '',
    treasuryAddress: process.env.ARENA_TREASURY_ADDRESS || '',
    collateralAddress: process.env.ARENA_COLLATERAL_ADDRESS || '', // USDT address
  },
});
