import { ProcessedEventModel, IndexerStateModel } from '../db/schemas';
import { config } from '../config/env';

/**
 * Generate unique key for event deduplication
 * Format: chainId:txHash:logIndex
 */
export function getEventKey(txHash: string, logIndex: number): string {
  return `${config.chainId}:${txHash}:${logIndex}`;
}

/**
 * Check if event was already processed
 */
export async function isEventProcessed(txHash: string, logIndex: number): Promise<boolean> {
  const key = getEventKey(txHash, logIndex);
  const exists = await ProcessedEventModel.exists({ key });
  return !!exists;
}

/**
 * Mark event as processed
 */
export async function markEventProcessed(
  txHash: string,
  logIndex: number,
  blockNumber: number,
  eventName: string
): Promise<void> {
  const key = getEventKey(txHash, logIndex);
  
  await ProcessedEventModel.findOneAndUpdate(
    { key },
    {
      key,
      txHash,
      logIndex,
      blockNumber,
      eventName,
      processedAt: new Date(),
    },
    { upsert: true }
  );
}

/**
 * Get last synced block from state
 */
export async function getLastSyncedBlock(): Promise<number> {
  const state = await IndexerStateModel.findOne({ key: 'main' });
  return state?.lastSyncedBlock || config.startBlock;
}

/**
 * Update last synced block
 */
export async function updateLastSyncedBlock(blockNumber: number): Promise<void> {
  await IndexerStateModel.findOneAndUpdate(
    { key: 'main' },
    {
      key: 'main',
      lastSyncedBlock: blockNumber,
      updatedAt: new Date(),
    },
    { upsert: true }
  );
}

/**
 * Check if block is confirmed (enough confirmations)
 */
export function isBlockConfirmed(blockNumber: number, currentBlock: number): boolean {
  return (currentBlock - blockNumber) >= config.confirmations;
}
