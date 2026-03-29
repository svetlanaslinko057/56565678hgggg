import { EventLog } from 'ethers';
import { getContract, getCurrentBlock, getContractEvents } from '../contracts/client';
import { config } from '../config/env';
import {
  isEventProcessed,
  markEventProcessed,
  getLastSyncedBlock,
  updateLastSyncedBlock,
  isBlockConfirmed,
} from './dedupe';
import {
  handleMarketCreated,
  handleMarketLocked,
  handleMarketResolved,
  handleMarketDisputed,
  handleMarketCancelled,
} from './handlers/market';
import {
  handleBetPlaced,
  handlePositionClaimed,
  handleRefund,
  handleTransfer,
  updatePositionStatuses,
} from './handlers/position';

const BATCH_SIZE = 100; // blocks per batch (small for BSC rate limits)
const POLL_INTERVAL = 5000; // 5 seconds
const BATCH_DELAY = 1000; // delay between batches

/**
 * Process a single event
 */
async function processEvent(event: EventLog): Promise<void> {
  const txHash = event.transactionHash;
  const logIndex = event.index;
  const blockNumber = event.blockNumber;
  const eventName = (event as any).eventName;
  
  // Check if already processed (dedupe)
  if (await isEventProcessed(txHash, logIndex)) {
    return;
  }
  
  const args = (event as any).args;
  
  try {
    switch (eventName) {
      case 'MarketCreated':
        await handleMarketCreated(
          {
            marketId: args.marketId,
            endTime: args.endTime,
            question: args.question,
            outcomeCount: args.outcomeCount,
          },
          txHash,
          blockNumber
        );
        break;
        
      case 'BetPlaced':
      case 'PositionMinted':
        await handleBetPlaced(
          {
            marketId: args.marketId,
            tokenId: args.tokenId,
            user: args.user || args.owner,
            outcome: args.outcome,
            amount: args.amount,
          },
          txHash,
          blockNumber
        );
        break;
        
      case 'MarketLocked':
        await handleMarketLocked(Number(args.marketId), txHash, blockNumber);
        break;
        
      case 'MarketResolved':
        await handleMarketResolved(
          {
            marketId: args.marketId,
            resolvedOutcome: args.resolvedOutcome,
            totalWinningStaked: args.totalWinningStaked,
          },
          txHash,
          blockNumber
        );
        // Update position statuses
        await updatePositionStatuses(Number(args.marketId), args.resolvedOutcome);
        break;
        
      case 'MarketDisputed':
        await handleMarketDisputed(Number(args.marketId), txHash, blockNumber);
        break;
        
      case 'MarketCancelled':
        await handleMarketCancelled(Number(args.marketId), txHash, blockNumber);
        break;
        
      case 'PositionClaimed':
        await handlePositionClaimed(
          {
            tokenId: args.tokenId,
            owner: args.owner,
            grossAmount: args.grossAmount,
            feeAmount: args.feeAmount,
            netAmount: args.netAmount,
          },
          txHash,
          blockNumber
        );
        break;
        
      case 'Refund':
        await handleRefund(
          {
            tokenId: args.tokenId,
            owner: args.owner,
            amount: args.amount,
          },
          txHash,
          blockNumber
        );
        break;
        
      case 'Transfer':
        await handleTransfer(
          {
            from: args.from,
            to: args.to,
            tokenId: args.tokenId,
          },
          txHash,
          blockNumber
        );
        break;
        
      default:
        // Unknown event, skip
        return;
    }
    
    // Mark as processed
    await markEventProcessed(txHash, logIndex, blockNumber, eventName);
    
  } catch (error) {
    console.error(`Error processing event ${eventName}:`, error);
    throw error;
  }
}

/**
 * Process events in a block range
 */
async function processBlockRange(fromBlock: number, toBlock: number): Promise<number> {
  const events = await getContractEvents(fromBlock, toBlock);
  
  // Sort by block number, then log index
  events.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.index - b.index;
  });
  
  let processed = 0;
  for (const event of events) {
    await processEvent(event);
    processed++;
  }
  
  return processed;
}

/**
 * Run backfill from start block to current
 */
export async function runBackfill(): Promise<void> {
  const startBlock = await getLastSyncedBlock();
  const currentBlock = await getCurrentBlock();
  const safeBlock = currentBlock - config.confirmations;
  
  if (startBlock >= safeBlock) {
    console.log('✅ Already synced to latest safe block');
    return;
  }
  
  console.log(`🔄 Backfill: blocks ${startBlock} → ${safeBlock}`);
  
  let fromBlock = startBlock;
  let totalProcessed = 0;
  
  while (fromBlock < safeBlock) {
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, safeBlock);
    
    console.log(`  Processing blocks ${fromBlock} → ${toBlock}...`);
    const processed = await processBlockRange(fromBlock, toBlock);
    totalProcessed += processed;
    
    await updateLastSyncedBlock(toBlock);
    fromBlock = toBlock + 1;
    
    // Delay between batches to avoid rate limiting
    if (fromBlock < safeBlock) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
  
  console.log(`✅ Backfill complete: ${totalProcessed} events processed`);
}

/**
 * Start live listener (polling mode)
 */
export async function startListener(): Promise<void> {
  console.log('🎧 Starting event listener...');
  
  const poll = async () => {
    try {
      const lastSynced = await getLastSyncedBlock();
      const currentBlock = await getCurrentBlock();
      const safeBlock = currentBlock - config.confirmations;
      
      if (lastSynced < safeBlock) {
        const fromBlock = lastSynced + 1;
        const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, safeBlock);
        
        const processed = await processBlockRange(fromBlock, toBlock);
        
        if (processed > 0) {
          console.log(`📦 Processed ${processed} events (blocks ${fromBlock}-${toBlock})`);
        }
        
        await updateLastSyncedBlock(toBlock);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };
  
  // Initial poll
  await poll();
  
  // Start polling interval
  setInterval(poll, POLL_INTERVAL);
  
  console.log(`✅ Listener started (polling every ${POLL_INTERVAL / 1000}s)`);
}

/**
 * Start listener with WebSocket (for real-time, if RPC supports it)
 */
export async function startWebSocketListener(): Promise<void> {
  const contract = getContract();
  
  console.log('🔌 Starting WebSocket listener...');
  
  // Listen to all events
  contract.on('*', async (event) => {
    try {
      const currentBlock = await getCurrentBlock();
      
      // Wait for confirmations
      if (!isBlockConfirmed(event.log.blockNumber, currentBlock)) {
        return;
      }
      
      await processEvent(event.log as EventLog);
      await updateLastSyncedBlock(event.log.blockNumber);
      
    } catch (error) {
      console.error('WebSocket event error:', error);
    }
  });
  
  console.log('✅ WebSocket listener started');
}
