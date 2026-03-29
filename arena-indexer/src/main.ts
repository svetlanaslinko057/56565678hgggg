import * as dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db/mongo';
import { runBackfill, startListener } from './indexer/listener';
import { config } from './config/env';

async function main() {
  console.log('========================================');
  console.log('🚀 FOMO Arena Indexer');
  console.log('========================================');
  console.log(`Chain ID: ${config.chainId}`);
  console.log(`Contract: ${config.contractAddress}`);
  console.log(`RPC: ${config.rpcUrl}`);
  console.log(`Confirmations: ${config.confirmations}`);
  console.log('========================================');
  
  // Connect to MongoDB
  await connectDB();
  
  // Run backfill first
  console.log('\n📚 Running backfill...');
  await runBackfill();
  
  // Start live listener
  console.log('\n🎧 Starting live listener...');
  await startListener();
  
  console.log('\n✅ Indexer is running');
  console.log('Press Ctrl+C to stop\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down indexer...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down indexer...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
