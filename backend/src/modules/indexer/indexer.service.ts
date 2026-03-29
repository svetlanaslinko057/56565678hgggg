import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prediction, PredictionDocument, PredictionStatus } from '../predictions/predictions.schema';
import { Position, PositionDocument, PositionStatus } from '../positions/positions.schema';

// Contract event types (matching ArenaCore.sol events)
interface MarketCreatedEvent {
  marketId: string;
  closeTime: number;
  outcomeCount: number;
  txHash: string;
  blockNumber: number;
}

interface PositionMintedEvent {
  tokenId: string;
  marketId: string;
  outcome: number;
  stake: string;
  shares: string;
  owner: string;
  txHash: string;
  blockNumber: number;
}

interface MarketResolvedEvent {
  marketId: string;
  winningOutcome: number;
  txHash: string;
  blockNumber: number;
}

interface ClaimEvent {
  tokenId: string;
  owner: string;
  payout: string;
  txHash: string;
  blockNumber: number;
}

/**
 * Indexer Service
 * 
 * Listens to blockchain events and syncs with database.
 * This is the bridge between on-chain state and off-chain UI.
 * 
 * When ARENA_ONCHAIN_ENABLED is true:
 * - Contract events → Backend DB → UI
 * - Backend becomes a "mirror" of contract state
 */
@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private readonly isEnabled: boolean;

  constructor(
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    private eventEmitter: EventEmitter2,
  ) {
    this.isEnabled = process.env.ARENA_ONCHAIN_ENABLED === 'true';
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.logger.log('Indexer enabled - starting event listener');
      this.startListening();
    } else {
      this.logger.log('Indexer disabled - running in off-chain mode');
    }
  }

  /**
   * Start listening to contract events
   * In production, this would connect to a node via ethers.js/viem
   */
  private startListening() {
    // TODO: Replace with actual contract event listeners
    // Example with ethers.js:
    // const provider = new ethers.providers.JsonRpcProvider(process.env.CHAIN_RPC);
    // const contract = new ethers.Contract(ARENA_CORE_ADDRESS, ArenaCore.abi, provider);
    // 
    // contract.on('MarketCreated', (marketId, closeTime, outcomeCount, event) => {
    //   this.handleMarketCreated({
    //     marketId: marketId.toString(),
    //     closeTime: closeTime.toNumber(),
    //     outcomeCount: outcomeCount,
    //     txHash: event.transactionHash,
    //     blockNumber: event.blockNumber,
    //   });
    // });
    
    this.logger.log('Event listeners would be attached here');
  }

  /**
   * Handle MarketCreated event
   */
  async handleMarketCreated(event: MarketCreatedEvent): Promise<void> {
    this.logger.log(`[Indexer] MarketCreated: ${event.marketId}`);
    
    // Update prediction with chain data
    await this.predictionModel.findOneAndUpdate(
      { 'chain.marketId': event.marketId },
      {
        $set: {
          'chain.txHash': event.txHash,
          'chain.blockNumber': event.blockNumber,
          'chain.confirmed': true,
        },
      },
    );

    // Emit internal event for other services
    this.eventEmitter.emit('chain.market.created', event);
  }

  /**
   * Handle PositionMinted event (bet placed on-chain)
   */
  async handlePositionMinted(event: PositionMintedEvent): Promise<void> {
    this.logger.log(`[Indexer] PositionMinted: Token ${event.tokenId} for market ${event.marketId}`);
    
    // Update position with NFT data
    await this.positionModel.findOneAndUpdate(
      { marketId: event.marketId, wallet: event.owner.toLowerCase() },
      {
        $set: {
          'nft.tokenId': event.tokenId,
          'nft.txHash': event.txHash,
          'nft.chainId': Number(process.env.CHAIN_ID) || 97,
        },
      },
    );

    this.eventEmitter.emit('chain.position.minted', event);
  }

  /**
   * Handle MarketResolved event
   */
  async handleMarketResolved(event: MarketResolvedEvent): Promise<void> {
    this.logger.log(`[Indexer] MarketResolved: ${event.marketId} -> outcome ${event.winningOutcome}`);
    
    // Update prediction status
    const prediction = await this.predictionModel.findOneAndUpdate(
      { 'chain.marketId': event.marketId },
      {
        $set: {
          status: PredictionStatus.RESOLVED,
          winningOutcome: event.winningOutcome.toString(),
          resolvedAt: new Date(),
          'chain.resolveTxHash': event.txHash,
        },
      },
      { new: true },
    );

    if (prediction) {
      // Update all positions for this market
      const winningOutcomeStr = event.winningOutcome.toString();
      
      await this.positionModel.updateMany(
        { marketId: event.marketId, outcomeId: winningOutcomeStr },
        { $set: { status: PositionStatus.WON, resolvedAt: new Date() } },
      );
      
      await this.positionModel.updateMany(
        { marketId: event.marketId, outcomeId: { $ne: winningOutcomeStr } },
        { $set: { status: PositionStatus.LOST, resolvedAt: new Date() } },
      );
    }

    this.eventEmitter.emit('chain.market.resolved', event);
  }

  /**
   * Handle Claim event
   */
  async handleClaim(event: ClaimEvent): Promise<void> {
    this.logger.log(`[Indexer] Claim: Token ${event.tokenId} by ${event.owner}`);
    
    await this.positionModel.findOneAndUpdate(
      { 'nft.tokenId': event.tokenId },
      {
        $set: {
          status: PositionStatus.CLAIMED,
          claimedAt: new Date(),
          'nft.claimTxHash': event.txHash,
        },
      },
    );

    this.eventEmitter.emit('chain.position.claimed', event);
  }

  /**
   * Simulate contract events for testing
   * This allows the UI to work with event flow before actual contract deployment
   */
  async simulateContractEvents(): Promise<void> {
    this.logger.log('[Indexer] Simulating contract events...');
    
    // Simulate MarketCreated
    await this.handleMarketCreated({
      marketId: 'sim_1',
      closeTime: Date.now() + 86400000,
      outcomeCount: 2,
      txHash: '0x' + 'a'.repeat(64),
      blockNumber: 12345,
    });
    
    this.logger.log('[Indexer] Simulation complete');
  }

  /**
   * Get indexer status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      mode: this.isEnabled ? 'on-chain' : 'off-chain',
      chainId: process.env.CHAIN_ID || '97',
      rpc: process.env.CHAIN_RPC ? 'configured' : 'not configured',
    };
  }

  // ==================== API Methods for Markets Controller ====================

  /**
   * Get market stats (used by markets controller)
   */
  async getMarketStats(marketId: string): Promise<any> {
    const positions = await this.positionModel.find({ marketId }).lean().exec();
    const uniqueWallets = new Set(positions.map(p => p.wallet));
    
    const outcomePools: Record<string, number> = {};
    for (const pos of positions) {
      outcomePools[pos.outcomeId] = (outcomePools[pos.outcomeId] || 0) + pos.stake;
    }

    return {
      totalVolume: positions.reduce((sum, p) => sum + p.stake, 0),
      totalBets: positions.length,
      participantsCount: uniqueWallets.size,
      outcomePools,
    };
  }

  /**
   * Get live bets for a market
   */
  async getLiveBets(marketId: string, limit: number = 20): Promise<any[]> {
    const positions = await this.positionModel
      .find({ marketId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return positions.map(pos => ({
      id: (pos as any)._id.toString(),
      wallet: pos.wallet,
      outcomeId: pos.outcomeId,
      outcomeLabel: pos.outcomeLabel,
      stake: pos.stake,
      odds: pos.odds,
      createdAt: (pos as any).createdAt,
    }));
  }

  /**
   * Get all positions for a market
   */
  async getMarketPositions(marketId: string): Promise<any[]> {
    const positions = await this.positionModel
      .find({ marketId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return positions.map(pos => ({
      id: (pos as any)._id.toString(),
      wallet: pos.wallet,
      outcomeId: pos.outcomeId,
      outcomeLabel: pos.outcomeLabel,
      stake: pos.stake,
      odds: pos.odds,
      potentialReturn: pos.potentialReturn,
      status: pos.status,
      nft: pos.nft,
      createdAt: (pos as any).createdAt,
    }));
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(limit: number = 20): Promise<any[]> {
    const positions = await this.positionModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return positions.map(pos => ({
      id: (pos as any)._id.toString(),
      type: 'bet',
      wallet: pos.wallet,
      marketId: pos.marketId,
      outcomeId: pos.outcomeId,
      outcomeLabel: pos.outcomeLabel,
      stake: pos.stake,
      odds: pos.odds,
      timestamp: (pos as any).createdAt,
    }));
  }
}
