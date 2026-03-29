import { MarketMirrorModel, PositionMirrorModel, ActivityModel } from '../../db/schemas';
import { MarketStatusNames } from '../../contracts/abi';

interface MarketCreatedArgs {
  marketId: bigint;
  endTime: bigint;
  question: string;
  outcomeCount: bigint | number;
}

interface MarketResolvedArgs {
  marketId: bigint;
  resolvedOutcome: number;
  totalWinningStaked: bigint;
}

/**
 * Handle MarketCreated event
 */
export async function handleMarketCreated(
  args: MarketCreatedArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const marketId = Number(args.marketId);
  const outcomeCount = Number(args.outcomeCount);
  
  console.log(`📊 MarketCreated: #${marketId} - "${args.question}"`);
  
  await MarketMirrorModel.findOneAndUpdate(
    { marketId },
    {
      marketId,
      question: args.question,
      outcomeCount: outcomeCount,
      outcomeLabels: [], // Will be filled by backfill or subsequent events
      endTime: Number(args.endTime),
      status: 'active',
      totalStaked: '0',
      totalWinningStaked: '0',
      txHash,
      blockNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  
  // Create activity
  await ActivityModel.create({
    type: 'market_created',
    marketId,
    data: {
      question: args.question,
      outcomeCount: outcomeCount,
      endTime: Number(args.endTime),
    },
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Handle MarketLocked event
 */
export async function handleMarketLocked(
  marketId: number,
  txHash: string,
  blockNumber: number
): Promise<void> {
  console.log(`🔒 MarketLocked: #${marketId}`);
  
  await MarketMirrorModel.findOneAndUpdate(
    { marketId },
    {
      status: 'locked',
      updatedAt: new Date(),
    }
  );
}

/**
 * Handle MarketResolved event
 */
export async function handleMarketResolved(
  args: MarketResolvedArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const marketId = Number(args.marketId);
  const resolvedOutcome = Number(args.resolvedOutcome);
  
  console.log(`✅ MarketResolved: #${marketId} → Outcome ${resolvedOutcome}`);
  
  // Get market info for notification
  const market = await MarketMirrorModel.findOne({ marketId });
  
  await MarketMirrorModel.findOneAndUpdate(
    { marketId },
    {
      status: 'resolved',
      resolvedOutcome: resolvedOutcome,
      totalWinningStaked: args.totalWinningStaked.toString(),
      updatedAt: new Date(),
    }
  );
  
  // Update all positions for this market
  const positions = await PositionMirrorModel.find({ marketId });
  
  for (const position of positions) {
    const isWinner = position.outcome === resolvedOutcome;
    const newStatus = isWinner ? 'won' : 'lost';
    
    await PositionMirrorModel.findOneAndUpdate(
      { tokenId: position.tokenId },
      { status: newStatus, updatedAt: new Date() }
    );
    
    // Send notification via webhook
    try {
      const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';
      await fetch(`${BACKEND_URL}/onchain/webhook/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isWinner ? 'position_won' : 'position_lost',
          user: position.owner,
          marketId,
          tokenId: position.tokenId,
          amount: position.amount,
          outcome: position.outcome,
          question: market?.question,
          txHash,
        }),
      });
    } catch (err) {
      console.error('Failed to send notification webhook:', err);
    }
  }
  
  // Create activity
  await ActivityModel.create({
    type: 'market_resolved',
    marketId,
    outcome: resolvedOutcome,
    data: {
      resolvedOutcome: resolvedOutcome,
      totalWinningStaked: args.totalWinningStaked.toString(),
    },
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Handle MarketDisputed event
 */
export async function handleMarketDisputed(
  marketId: number,
  txHash: string,
  blockNumber: number
): Promise<void> {
  console.log(`⚠️ MarketDisputed: #${marketId}`);
  
  await MarketMirrorModel.findOneAndUpdate(
    { marketId },
    {
      status: 'disputed',
      updatedAt: new Date(),
    }
  );
}

/**
 * Handle MarketCancelled event
 */
export async function handleMarketCancelled(
  marketId: number,
  txHash: string,
  blockNumber: number
): Promise<void> {
  console.log(`❌ MarketCancelled: #${marketId}`);
  
  await MarketMirrorModel.findOneAndUpdate(
    { marketId },
    {
      status: 'cancelled',
      updatedAt: new Date(),
    }
  );
  
  // Create activity
  await ActivityModel.create({
    type: 'market_cancelled',
    marketId,
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}
