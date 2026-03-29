import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.schema';
import { XpService } from '../xp/xp.service';

/**
 * MIRROR SERVICE
 * Reads on-chain data from indexer mirror collections
 * This is the bridge between indexer and backend API
 */
@Injectable()
export class MirrorService {
  private readonly logger = new Logger(MirrorService.name);
  
  constructor(
    @InjectConnection() private connection: Connection,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => XpService))
    private xpService: XpService,
  ) {}
  
  /**
   * Get on-chain markets from mirror collection
   */
  async getOnchainMarkets(params: {
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'trending' | 'volume' | 'bets';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const collection = this.connection.collection('markets_mirror');
    
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    // Determine sort field
    let sortField: any = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy === 'volume') {
      sortField = { totalVolume: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'bets') {
      sortField = { totalBets: sortOrder === 'asc' ? 1 : -1 };
    }
    
    const [markets, total] = await Promise.all([
      collection.find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);
    
    // Fetch FOMO pressure for each market
    const marketsWithPressure = await Promise.all(
      markets.map(async (market) => {
        try {
          const pressure = await this.getMarketPressure(market.marketId);
          return { ...market, fomoData: pressure };
        } catch {
          return { ...market, fomoData: null };
        }
      })
    );
    
    // If sorting by trending, sort by FOMO score
    let finalMarkets = marketsWithPressure;
    if (sortBy === 'trending') {
      finalMarkets = marketsWithPressure.sort((a, b) => {
        const scoreA = this.calculateTrendingScore(a.fomoData);
        const scoreB = this.calculateTrendingScore(b.fomoData);
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }
    
    return {
      data: finalMarkets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Calculate trending score for sorting
   * Higher score = more trending
   */
  private calculateTrendingScore(fomoData: any): number {
    if (!fomoData) return 0;
    
    let score = 0;
    
    // Activity weight (bets in last 5 min)
    score += fomoData.activity?.betsLast5Min * 10;
    
    // Volume weight
    score += Math.min(fomoData.activity?.volumeLast5Min || 0, 1000) / 10;
    
    // Pressure bonus
    if (fomoData.pressure?.level === 'high') score += 50;
    else if (fomoData.pressure?.level === 'medium') score += 25;
    
    // Trending flag bonus
    if (fomoData.flags?.isTrending) score += 30;
    
    return score;
  }
  
  /**
   * FOMO ENGINE - Get market pressure and sentiment data
   * Returns activity, sentiment percentages, and pressure indicators
   */
  async getMarketPressure(marketId: number) {
    const activitiesCollection = this.connection.collection('activities');
    const positionsCollection = this.connection.collection('positions_mirror');
    
    // Time window: last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Get bets in last 5 minutes for this market
    const recentBets = await activitiesCollection.find({
      marketId,
      type: 'BET',
      createdAt: { $gte: fiveMinutesAgo },
    }).toArray();
    
    const betsLast5Min = recentBets.length;
    
    // Calculate volume in last 5 minutes
    const volumeLast5Min = recentBets.reduce((sum, bet) => {
      const amount = bet.amount ? Number(BigInt(bet.amount) / BigInt(10**18)) : 0;
      return sum + amount;
    }, 0);
    
    // Get all positions for this market to calculate sentiment
    const positions = await positionsCollection.find({ marketId }).toArray();
    
    // Calculate YES/NO volumes
    let yesVolume = 0;
    let noVolume = 0;
    
    for (const pos of positions) {
      const amount = pos.amount ? Number(BigInt(pos.amount) / BigInt(10**18)) : 0;
      if (pos.outcome === 1 || pos.outcome === 'YES' || pos.outcome === 'yes') {
        yesVolume += amount;
      } else {
        noVolume += amount;
      }
    }
    
    const totalVolume = yesVolume + noVolume;
    const yesPercent = totalVolume > 0 ? Math.round((yesVolume / totalVolume) * 100) : 50;
    const noPercent = 100 - yesPercent;
    
    // Calculate pressure level
    let pressureLevel: 'low' | 'medium' | 'high';
    if (betsLast5Min > 10) {
      pressureLevel = 'high';
    } else if (betsLast5Min > 5) {
      pressureLevel = 'medium';
    } else {
      pressureLevel = 'low';
    }
    
    // Calculate trend
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (yesPercent > 65) {
      trend = 'bullish';
    } else if (yesPercent < 35) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }
    
    // Check if market is trending (high activity)
    const isTrending = betsLast5Min > 5 || volumeLast5Min > 100;
    
    // Get whale bets (bets > $100)
    const whaleBets = await this.getWhaleBetsForMarket(marketId);
    
    // Get market closing time
    const market = await this.connection.collection('markets_mirror').findOne({ marketId });
    const closingTime = market?.endTime || market?.expiresAt || null;
    const closingIn = closingTime ? Math.max(0, new Date(closingTime).getTime() - Date.now()) : null;
    const closingInMinutes = closingIn ? Math.round(closingIn / 60000) : null;
    
    return {
      activity: {
        betsLast5Min,
        volumeLast5Min: Math.round(volumeLast5Min),
        totalBets: positions.length,
        totalVolume: Math.round(totalVolume),
      },
      sentiment: {
        yesPercent,
        noPercent,
        yesVolume: Math.round(yesVolume),
        noVolume: Math.round(noVolume),
      },
      pressure: {
        level: pressureLevel,
        trend,
      },
      flags: {
        isTrending,
        isHighActivity: pressureLevel === 'high',
        isBullish: trend === 'bullish',
        isBearish: trend === 'bearish',
      },
      whales: whaleBets,
      closing: {
        time: closingTime,
        inMinutes: closingInMinutes,
        isUrgent: closingInMinutes !== null && closingInMinutes < 120, // < 2 hours
      },
    };
  }
  
  /**
   * Get whale bets for a market (bets > $100)
   */
  private async getWhaleBetsForMarket(marketId: number) {
    const positionsCollection = this.connection.collection('positions_mirror');
    const WHALE_THRESHOLD = 100; // $100 minimum for whale
    
    const positions = await positionsCollection.find({ marketId }).toArray();
    
    const whaleBets = [];
    for (const pos of positions) {
      const amount = pos.amount ? Number(BigInt(pos.amount) / BigInt(10**18)) : 0;
      if (amount >= WHALE_THRESHOLD) {
        whaleBets.push({
          wallet: pos.owner?.slice(0, 10) + '...',
          amount: Math.round(amount),
          side: pos.outcome === 1 || pos.outcome === 'YES' ? 'yes' : 'no',
          createdAt: pos.createdAt,
        });
      }
    }
    
    // Sort by amount descending, return top 5
    return whaleBets
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }
  
  /**
   * Get single on-chain market by ID
   */
  async getOnchainMarket(marketId: number) {
    const collection = this.connection.collection('markets_mirror');
    return await collection.findOne({ marketId });
  }
  
  /**
   * Get positions for a user
   */
  async getUserPositions(owner: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 50 } = params || {};
    
    const collection = this.connection.collection('positions_mirror');
    
    const query: any = { owner: owner.toLowerCase() };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [positions, total] = await Promise.all([
      collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);
    
    return {
      data: positions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Get user token IDs
   */
  async getUserTokenIds(owner: string): Promise<number[]> {
    const collection = this.connection.collection('positions_mirror');
    
    const positions = await collection.find(
      { owner: owner.toLowerCase() },
      { projection: { tokenId: 1 } }
    ).toArray();
    
    return positions.map(p => p.tokenId);
  }
  
  /**
   * Get positions for a market
   */
  async getMarketPositions(marketId: number) {
    const collection = this.connection.collection('positions_mirror');
    return await collection.find({ marketId }).toArray();
  }
  
  /**
   * Get activities feed
   */
  async getActivities(params?: {
    type?: string;
    user?: string;
    marketId?: number;
    page?: number;
    limit?: number;
  }) {
    const { type, user, marketId, page = 1, limit = 50 } = params || {};
    
    const collection = this.connection.collection('activities');
    
    const query: any = {};
    if (type) query.type = type;
    if (user) query.user = user.toLowerCase();
    if (marketId) query.marketId = marketId;
    
    const skip = (page - 1) * limit;
    
    const [activities, total] = await Promise.all([
      collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);
    
    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Get leaderboard from on-chain positions
   */
  async getOnchainLeaderboard(limit: number = 20) {
    const collection = this.connection.collection('positions_mirror');
    
    // Aggregate to calculate user stats
    const leaderboard = await collection.aggregate([
      {
        $group: {
          _id: '$owner',
          totalBets: { $sum: 1 },
          wonBets: {
            $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] }
          },
          totalVolume: { $sum: { $toDouble: '$amount' } },
        }
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ['$totalBets', 0] },
              { $divide: ['$wonBets', '$totalBets'] },
              0
            ]
          }
        }
      },
      { $sort: { totalVolume: -1 } },
      { $limit: limit },
    ]).toArray();
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      address: entry._id,
      totalBets: entry.totalBets,
      wonBets: entry.wonBets,
      winRate: Math.round(entry.winRate * 100),
      totalVolume: entry.totalVolume,
    }));
  }
  
  /**
   * Get stats for dashboard
   */
  async getOnchainStats() {
    const marketsCollection = this.connection.collection('markets_mirror');
    const positionsCollection = this.connection.collection('positions_mirror');
    
    const [
      totalMarkets,
      activeMarkets,
      totalPositions,
      claimedPositions,
    ] = await Promise.all([
      marketsCollection.countDocuments(),
      marketsCollection.countDocuments({ status: 'active' }),
      positionsCollection.countDocuments(),
      positionsCollection.countDocuments({ status: 'claimed' }),
    ]);
    
    // Calculate total volume
    const volumeAgg = await positionsCollection.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
    ]).toArray();
    
    const totalVolume = volumeAgg[0]?.total || 0;
    
    return {
      totalMarkets,
      activeMarkets,
      totalPositions,
      claimedPositions,
      totalVolume,
    };
  }
  
  /**
   * Get indexer sync status
   */
  async getIndexerStatus() {
    try {
      // Try direct collection access
      const db = this.connection.db;
      const stateCollection = db.collection('indexer_state');
      const state = await stateCollection.findOne({ key: 'main' });
      
      console.log('DB name:', db.databaseName);
      console.log('Indexer state from DB:', state);
      
      return {
        lastSyncedBlock: state?.lastSyncedBlock || 0,
        updatedAt: state?.updatedAt,
        isRunning: state ? true : false,
      };
    } catch (error) {
      console.error('Error getting indexer status:', error);
      return {
        lastSyncedBlock: 0,
        updatedAt: null,
        isRunning: false,
      };
    }
  }
  
  /**
   * Get user profile stats from on-chain positions
   */
  async getUserProfile(wallet: string) {
    const userWallet = wallet.toLowerCase();
    const collection = this.connection.collection('positions_mirror');
    
    // Get all positions for user
    const positions = await collection.find({ owner: userWallet }).toArray();
    
    if (positions.length === 0) {
      return {
        wallet: userWallet,
        stats: {
          totalBets: 0,
          wins: 0,
          losses: 0,
          winrate: 0,
          totalStaked: 0,
          totalClaimed: 0,
          pnl: 0,
          avgBet: 0,
        },
        streak: {
          current: 0,
          best: 0,
        },
        positions: {
          active: 0,
          won: 0,
          lost: 0,
          claimed: 0,
        },
      };
    }
    
    // Filter by status
    const won = positions.filter(p => p.status === 'won' || p.status === 'claimed');
    const lost = positions.filter(p => p.status === 'lost');
    const claimed = positions.filter(p => p.status === 'claimed');
    const active = positions.filter(p => p.status === 'open' || p.status === 'active');
    
    // Calculate stats
    const totalBets = positions.length;
    const wins = won.length;
    const losses = lost.length;
    
    const winrate = (wins + losses) > 0
      ? (wins / (wins + losses)) * 100
      : 0;
    
    // Calculate amounts (convert from wei string to number)
    const totalStaked = positions.reduce((sum, p) => {
      const amount = BigInt(p.amount || '0');
      return sum + Number(amount / BigInt(10**18));
    }, 0);
    
    // For claimed, estimate payout (amount * 2 for simplicity, or use actual payout if stored)
    const totalClaimed = claimed.reduce((sum, p) => {
      const amount = BigInt(p.amount || '0');
      // Winner gets back stake + winnings (simplified: ~2x for now)
      return sum + Number(amount / BigInt(10**18)) * 1.96; // 2x minus 2% fee
    }, 0);
    
    const pnl = totalClaimed - totalStaked;
    const avgBet = totalBets > 0 ? totalStaked / totalBets : 0;
    
    // Calculate streak
    const sortedPositions = positions
      .filter(p => p.status === 'won' || p.status === 'lost' || p.status === 'claimed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let currentStreak = 0;
    let bestStreak = 0;
    
    for (const p of sortedPositions) {
      if (p.status === 'won' || p.status === 'claimed') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return {
      wallet: userWallet,
      stats: {
        totalBets,
        wins,
        losses,
        winrate: Number(winrate.toFixed(1)),
        totalStaked: Number(totalStaked.toFixed(2)),
        totalClaimed: Number(totalClaimed.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        avgBet: Number(avgBet.toFixed(2)),
      },
      streak: {
        current: currentStreak,
        best: bestStreak,
      },
      positions: {
        active: active.length,
        won: wins,
        lost: losses,
        claimed: claimed.length,
      },
    };
  }
  
  /**
   * Get contract config from blockchain
   */
  async getContractConfig() {
    const { ethers } = await import('ethers');
    
    const RPC_URL = process.env.CHAIN_RPC || 'https://bsc-testnet.publicnode.com';
    const CONTRACT_ADDRESS = process.env.PREDICTION_CONTRACT || '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e';
    
    const ABI = [
      'function owner() view returns (address)',
      'function claimFeeBps() view returns (uint256)',
      'function feeRecipient() view returns (address)',
      'function minBet() view returns (uint256)',
      'function minInitialStake() view returns (uint256)',
      'function stableTokenDecimals() view returns (uint8)',
      'function stableToken() view returns (address)',
      'function userMarketRequestsEnabled() view returns (bool)',
    ];
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      
      const [
        owner,
        claimFeeBps,
        feeRecipient,
        minBet,
        minInitialStake,
        stableTokenDecimals,
        stableToken,
        userMarketRequestsEnabled,
      ] = await Promise.all([
        contract.owner(),
        contract.claimFeeBps(),
        contract.feeRecipient(),
        contract.minBet(),
        contract.minInitialStake(),
        contract.stableTokenDecimals(),
        contract.stableToken(),
        contract.userMarketRequestsEnabled(),
      ]);
      
      const decimals = Number(stableTokenDecimals);
      
      return {
        contractAddress: CONTRACT_ADDRESS,
        chainId: parseInt(process.env.CHAIN_ID || '97'),
        owner,
        claimFeeBps: Number(claimFeeBps),
        feeRecipient,
        minBet: minBet.toString(),
        minBetFormatted: ethers.formatUnits(minBet, decimals),
        minInitialStake: minInitialStake.toString(),
        minInitialStakeFormatted: ethers.formatUnits(minInitialStake, decimals),
        stableToken,
        stableTokenDecimals: decimals,
        userMarketRequestsEnabled,
      };
    } catch (error) {
      this.logger.error('Failed to get contract config:', error);
      throw error;
    }
  }
  
  /**
   * Process indexer event and create notification + XP
   */
  async processIndexerEvent(event: {
    type: string;
    user?: string;
    marketId?: number;
    tokenId?: number;
    amount?: string;
    outcome?: number;
    question?: string;
    txHash?: string;
  }) {
    this.logger.log(`Processing indexer event: ${event.type}`);
    
    if (!event.user) {
      return { processed: false, reason: 'No user address' };
    }
    
    const userWallet = event.user.toLowerCase();
    
    try {
      switch (event.type) {
        case 'bet_placed': {
          // Award XP for bet
          const xpResult = await this.xpService.onBetPlaced(userWallet);
          
          // Send XP notification if earned badges
          if (xpResult.badges.length > 0 || xpResult.levelUp) {
            await this.notificationsService.notifyXpEarned(
              userWallet,
              xpResult.xp,
              xpResult.levelUp ? 'Level Up!' : (xpResult.badges.length > 0 ? `Badge: ${xpResult.badges.join(', ')}` : 'Bet Placed')
            );
          }
          
          return { 
            processed: true, 
            type: 'bet_placed',
            xp: xpResult.xp,
            badges: xpResult.badges,
            levelUp: xpResult.levelUp,
          };
        }
        
        case 'position_won': {
          // Format amount from wei
          const winAmount = event.amount 
            ? Number(BigInt(event.amount) / BigInt(10**18))
            : 0;
          
          // Award XP for win
          const xpResult = await this.xpService.onWin(userWallet, winAmount);
          
          // Send win notification
          await this.notificationsService.notifyPredictionWon(
            userWallet,
            event.tokenId?.toString() || '',
            event.marketId?.toString() || '',
            winAmount,
            event.question || 'Market prediction'
          );
          
          // Send XP notification
          await this.notificationsService.notifyXpEarned(
            userWallet,
            xpResult.xp,
            xpResult.streak >= 3 ? `🔥 ${xpResult.streak} Win Streak!` : (xpResult.badges.length > 0 ? `Badge: ${xpResult.badges.join(', ')}` : 'Victory!')
          );
          
          return { 
            processed: true, 
            type: 'position_won',
            xp: xpResult.xp,
            badges: xpResult.badges,
            streak: xpResult.streak,
            levelUp: xpResult.levelUp,
          };
        }
          
        case 'position_lost': {
          // Award consolation XP
          const xpResult = await this.xpService.onLoss(userWallet);
          
          // Send loss notification
          await this.notificationsService.notifyPredictionLost(
            userWallet,
            event.tokenId?.toString() || '',
            event.marketId?.toString() || '',
            event.question || 'Market prediction'
          );
          
          return { 
            processed: true, 
            type: 'position_lost',
            xp: xpResult.xp,
          };
        }
        
        case 'position_claimed': {
          // Award XP for claim
          const xpResult = await this.xpService.onClaim(userWallet);
          
          return { 
            processed: true, 
            type: 'position_claimed',
            xp: xpResult.xp,
          };
        }
          
        case 'market_resolved':
          return { processed: true, type: 'market_resolved' };
          
        default:
          return { processed: false, reason: `Unknown event type: ${event.type}` };
      }
    } catch (error) {
      this.logger.error(`Failed to process event: ${error.message}`);
      return { processed: false, error: error.message };
    }
  }
}
