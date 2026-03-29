import { PositionMirrorModel, MarketMirrorModel, ActivityModel } from '../../db/schemas';

interface BetPlacedArgs {
  marketId: bigint;
  tokenId: bigint;
  user: string;
  outcome: bigint | number;
  amount: bigint;
}

interface PositionClaimedArgs {
  tokenId: bigint;
  owner: string;
  grossAmount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
}

interface RefundArgs {
  tokenId: bigint;
  owner: string;
  amount: bigint;
}

interface TransferArgs {
  from: string;
  to: string;
  tokenId: bigint;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Handle BetPlaced / PositionMinted event
 */
export async function handleBetPlaced(
  args: BetPlacedArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const tokenId = Number(args.tokenId);
  const marketId = Number(args.marketId);
  const outcome = Number(args.outcome);
  const user = args.user.toLowerCase();
  
  console.log(`🎯 BetPlaced: Token #${tokenId} on Market #${marketId} by ${user.slice(0, 10)}...`);
  
  // Create or update position
  await PositionMirrorModel.findOneAndUpdate(
    { tokenId },
    {
      tokenId,
      marketId,
      owner: user,
      outcome: outcome,
      amount: args.amount.toString(),
      claimed: false,
      status: 'open',
      txHash,
      blockNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  
  // Update market totalStaked (use $set instead of $inc because amount is string)
  const market = await MarketMirrorModel.findOne({ marketId });
  if (market) {
    const currentTotal = BigInt(market.totalStaked || '0');
    const newTotal = currentTotal + args.amount;
    await MarketMirrorModel.findOneAndUpdate(
      { marketId },
      {
        totalStaked: newTotal.toString(),
        updatedAt: new Date(),
      }
    );
  }
  
  // Create activity
  await ActivityModel.create({
    type: 'bet_placed',
    user,
    marketId,
    tokenId,
    amount: args.amount.toString(),
    outcome: outcome,
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Handle PositionClaimed event
 */
export async function handlePositionClaimed(
  args: PositionClaimedArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const tokenId = Number(args.tokenId);
  const owner = args.owner.toLowerCase();
  
  console.log(`💰 PositionClaimed: Token #${tokenId} by ${owner.slice(0, 10)}... → ${args.netAmount.toString()}`);
  
  // Update position
  await PositionMirrorModel.findOneAndUpdate(
    { tokenId },
    {
      claimed: true,
      status: 'claimed',
      updatedAt: new Date(),
    }
  );
  
  // Get position for activity
  const position = await PositionMirrorModel.findOne({ tokenId });
  
  // Create activity
  await ActivityModel.create({
    type: 'position_claimed',
    user: owner,
    marketId: position?.marketId,
    tokenId,
    amount: args.netAmount.toString(),
    data: {
      grossAmount: args.grossAmount.toString(),
      feeAmount: args.feeAmount.toString(),
      netAmount: args.netAmount.toString(),
    },
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Handle Refund event
 */
export async function handleRefund(
  args: RefundArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const tokenId = Number(args.tokenId);
  const owner = args.owner.toLowerCase();
  
  console.log(`🔄 Refund: Token #${tokenId} → ${args.amount.toString()}`);
  
  // Update position
  await PositionMirrorModel.findOneAndUpdate(
    { tokenId },
    {
      claimed: true,
      status: 'refunded',
      updatedAt: new Date(),
    }
  );
  
  // Get position for activity
  const position = await PositionMirrorModel.findOne({ tokenId });
  
  // Create activity
  await ActivityModel.create({
    type: 'position_refunded',
    user: owner,
    marketId: position?.marketId,
    tokenId,
    amount: args.amount.toString(),
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Handle Transfer (ERC721) event
 * CRITICAL: This tracks NFT ownership changes
 */
export async function handleTransfer(
  args: TransferArgs,
  txHash: string,
  blockNumber: number
): Promise<void> {
  const tokenId = Number(args.tokenId);
  const from = args.from.toLowerCase();
  const to = args.to.toLowerCase();
  
  // Skip mint events (handled by BetPlaced)
  if (from === ZERO_ADDRESS) {
    return;
  }
  
  // Skip burn events
  if (to === ZERO_ADDRESS) {
    return;
  }
  
  console.log(`📤 Transfer: Token #${tokenId} from ${from.slice(0, 10)}... → ${to.slice(0, 10)}...`);
  
  // Update owner
  await PositionMirrorModel.findOneAndUpdate(
    { tokenId },
    {
      owner: to,
      updatedAt: new Date(),
    }
  );
  
  // Get position for activity
  const position = await PositionMirrorModel.findOne({ tokenId });
  
  // Create activity
  await ActivityModel.create({
    type: 'transfer',
    user: to,
    marketId: position?.marketId,
    tokenId,
    data: {
      from,
      to,
    },
    txHash,
    blockNumber,
    createdAt: new Date(),
  });
}

/**
 * Update position status based on market resolution
 */
export async function updatePositionStatuses(marketId: number, winningOutcome: number): Promise<void> {
  // Mark winning positions
  await PositionMirrorModel.updateMany(
    { marketId, outcome: winningOutcome, status: 'open' },
    { status: 'won', updatedAt: new Date() }
  );
  
  // Mark losing positions
  await PositionMirrorModel.updateMany(
    { marketId, outcome: { $ne: winningOutcome }, status: 'open' },
    { status: 'lost', updatedAt: new Date() }
  );
}
