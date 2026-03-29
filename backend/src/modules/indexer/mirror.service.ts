import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Mirror Service
 * 
 * Reads data from the mirror collections populated by the indexer.
 * Used when ARENA_ONCHAIN_ENABLED=true.
 * 
 * Collections:
 * - markets_mirror: Chain market state
 * - positions_mirror: NFT positions
 * - activities: Event-driven activity feed
 * - tx_states: Transaction lifecycle tracking
 * - notifications: User notifications
 */
@Injectable()
export class MirrorService {
  private readonly logger = new Logger(MirrorService.name);

  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  // ============ Markets ============

  /**
   * Get market from mirror DB by chain market ID
   */
  async getMarket(chainMarketId: string): Promise<any | null> {
    const collection = this.connection.collection('markets_mirror');
    return collection.findOne({ chainMarketId });
  }

  /**
   * Get market by external ID (backend DB ID)
   */
  async getMarketByExternalId(externalMarketId: string): Promise<any | null> {
    const collection = this.connection.collection('markets_mirror');
    return collection.findOne({ externalMarketId });
  }

  /**
   * Get all markets with optional filters
   */
  async getMarkets(filters: {
    status?: string;
    creator?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<any[]> {
    const collection = this.connection.collection('markets_mirror');
    
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.creator) query.creator = filters.creator.toLowerCase();

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filters.skip || 0)
      .limit(filters.limit || 50)
      .toArray();
  }

  /**
   * Get active (open) markets
   */
  async getActiveMarkets(): Promise<any[]> {
    const collection = this.connection.collection('markets_mirror');
    return collection
      .find({ status: 'OPEN', frozen: { $ne: true } })
      .sort({ closeTime: 1 })
      .toArray();
  }

  // ============ Positions ============

  /**
   * Get position by token ID
   */
  async getPosition(tokenId: string): Promise<any | null> {
    const collection = this.connection.collection('positions_mirror');
    return collection.findOne({ tokenId });
  }

  /**
   * Get positions by owner wallet
   */
  async getPositionsByOwner(owner: string, filters: {
    chainMarketId?: string;
    claimed?: boolean;
    refunded?: boolean;
    limit?: number;
  } = {}): Promise<any[]> {
    const collection = this.connection.collection('positions_mirror');
    
    const query: any = { owner: owner.toLowerCase() };
    if (filters.chainMarketId) query.chainMarketId = filters.chainMarketId;
    if (filters.claimed !== undefined) query.claimed = filters.claimed;
    if (filters.refunded !== undefined) query.refunded = filters.refunded;

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100)
      .toArray();
  }

  /**
   * Get positions by market
   */
  async getPositionsByMarket(chainMarketId: string): Promise<any[]> {
    const collection = this.connection.collection('positions_mirror');
    return collection
      .find({ chainMarketId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get winning positions (for claim UI)
   */
  async getWinningPositions(owner: string): Promise<any[]> {
    const collection = this.connection.collection('positions_mirror');
    const marketsCollection = this.connection.collection('markets_mirror');

    // Get all unclaimed positions for owner
    const positions = await collection
      .find({ owner: owner.toLowerCase(), claimed: false, refunded: false })
      .toArray();

    // Filter to only winning positions
    const winningPositions: any[] = [];
    for (const pos of positions) {
      const market = await marketsCollection.findOne({ chainMarketId: pos.chainMarketId });
      if (market && market.status === 'RESOLVED' && market.winningOutcome === pos.outcomeId) {
        winningPositions.push({
          ...pos,
          market,
        });
      }
    }

    return winningPositions;
  }

  /**
   * Get refundable positions (cancelled market)
   */
  async getRefundablePositions(owner: string): Promise<any[]> {
    const collection = this.connection.collection('positions_mirror');
    const marketsCollection = this.connection.collection('markets_mirror');

    // Get all unrefunded positions for owner
    const positions = await collection
      .find({ owner: owner.toLowerCase(), refunded: false })
      .toArray();

    // Filter to only cancelled markets
    const refundablePositions: any[] = [];
    for (const pos of positions) {
      const market = await marketsCollection.findOne({ chainMarketId: pos.chainMarketId });
      if (market && market.status === 'CANCELLED') {
        refundablePositions.push({
          ...pos,
          market,
        });
      }
    }

    return refundablePositions;
  }

  // ============ Market Stats ============

  /**
   * Get market statistics from mirror
   */
  async getMarketStats(chainMarketId: string): Promise<{
    totalVolume: string;
    totalBets: number;
    participantsCount: number;
    outcomePools: Record<number, { stake: string; shares: string; bets: number }>;
  }> {
    const collection = this.connection.collection('positions_mirror');
    
    const positions = await collection.find({ chainMarketId }).toArray();
    
    const uniqueWallets = new Set(positions.map(p => p.owner));
    const outcomePools: Record<number, { stake: bigint; shares: bigint; bets: number }> = {};
    let totalVolume = BigInt(0);

    for (const pos of positions) {
      const stake = BigInt(pos.stake || '0');
      const shares = BigInt(pos.shares || '0');
      totalVolume += stake;

      if (!outcomePools[pos.outcomeId]) {
        outcomePools[pos.outcomeId] = { stake: BigInt(0), shares: BigInt(0), bets: 0 };
      }
      outcomePools[pos.outcomeId].stake += stake;
      outcomePools[pos.outcomeId].shares += shares;
      outcomePools[pos.outcomeId].bets += 1;
    }

    // Convert BigInt to string for response
    const outcomePoolsResult: Record<number, { stake: string; shares: string; bets: number }> = {};
    for (const [outcomeId, pool] of Object.entries(outcomePools)) {
      outcomePoolsResult[Number(outcomeId)] = {
        stake: pool.stake.toString(),
        shares: pool.shares.toString(),
        bets: pool.bets,
      };
    }

    return {
      totalVolume: totalVolume.toString(),
      totalBets: positions.length,
      participantsCount: uniqueWallets.size,
      outcomePools: outcomePoolsResult,
    };
  }

  // ============ Activity ============

  /**
   * Get activity feed from chain events
   */
  async getActivityFeed(filters: {
    wallet?: string;
    chainMarketId?: string;
    type?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<any[]> {
    const collection = this.connection.collection('activities');
    
    const query: any = {};
    if (filters.wallet) query.wallet = filters.wallet.toLowerCase();
    if (filters.chainMarketId) query.chainMarketId = filters.chainMarketId;
    if (filters.type) query.type = filters.type;

    return collection
      .find(query)
      .sort({ blockNumber: -1, logIndex: -1 })
      .skip(filters.skip || 0)
      .limit(filters.limit || 50)
      .toArray();
  }

  /**
   * Get recent bets for a market (live feed)
   */
  async getLiveBets(chainMarketId: string, limit = 20): Promise<any[]> {
    const collection = this.connection.collection('activities');
    
    return collection
      .find({ chainMarketId, type: 'POSITION_CREATED' })
      .sort({ blockNumber: -1 })
      .limit(limit)
      .toArray();
  }

  // ============ Transaction State ============

  /**
   * Get transaction state
   */
  async getTxState(txHash: string): Promise<any | null> {
    const collection = this.connection.collection('tx_states');
    return collection.findOne({ txHash: txHash.toLowerCase() });
  }

  /**
   * Get pending transactions for wallet
   */
  async getPendingTxs(wallet: string): Promise<any[]> {
    const collection = this.connection.collection('tx_states');
    return collection
      .find({ 
        wallet: wallet.toLowerCase(), 
        status: { $in: ['PENDING', 'CONFIRMED'] } 
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Track a new pending transaction
   */
  async trackPendingTx(params: {
    txHash: string;
    type: string;
    wallet?: string;
    tokenId?: string;
    chainMarketId?: string;
  }): Promise<void> {
    const collection = this.connection.collection('tx_states');
    
    await collection.updateOne(
      { txHash: params.txHash.toLowerCase() },
      {
        $setOnInsert: {
          txHash: params.txHash.toLowerCase(),
          chainId: parseInt(process.env.CHAIN_ID || '97'),
          type: params.type,
          status: 'PENDING',
          wallet: params.wallet?.toLowerCase(),
          tokenId: params.tokenId,
          chainMarketId: params.chainMarketId,
          createdAt: new Date(),
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }

  // ============ Notifications ============

  /**
   * Get unread notifications for wallet
   */
  async getNotifications(wallet: string, onlyUnread = false): Promise<any[]> {
    const collection = this.connection.collection('notifications');
    
    const query: any = { wallet: wallet.toLowerCase() };
    if (onlyUnread) query.read = false;

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(wallet: string): Promise<void> {
    const collection = this.connection.collection('notifications');
    await collection.updateMany(
      { wallet: wallet.toLowerCase(), read: false },
      { $set: { read: true } }
    );
  }

  // ============ Sync State ============

  /**
   * Get indexer sync state
   */
  async getSyncState(): Promise<{ lastProcessedBlock: number; updatedAt: Date } | null> {
    const collection = this.connection.collection('sync_states');
    const state = await collection.findOne({ key: 'arena-indexer' });
    if (!state) return null;
    return {
      lastProcessedBlock: state.lastProcessedBlock,
      updatedAt: state.updatedAt,
    };
  }
}
