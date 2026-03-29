import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analyst, AnalystDocument } from './analysts.schema';
import { UpdateAnalystDto, AnalystProfileResponse, TopPredictionResponse } from './analysts.dto';
import { SeasonsService } from '../seasons/seasons.service';
import { ArenaUser, ArenaUserDocument } from '../users/users.schema';

@Injectable()
export class AnalystsService {
  private readonly logger = new Logger(AnalystsService.name);

  constructor(
    @InjectModel(Analyst.name)
    private analystModel: Model<AnalystDocument>,
    @InjectModel(ArenaUser.name)
    private arenaUserModel: Model<ArenaUserDocument>,
    private seasonsService: SeasonsService,
  ) {}

  /**
   * Get or create analyst profile
   */
  async getOrCreate(wallet: string): Promise<AnalystDocument> {
    const normalizedWallet = wallet.toLowerCase();
    
    // First try analysts collection
    let analyst = await this.analystModel.findOne({ wallet: normalizedWallet }).exec();
    
    if (!analyst) {
      // Try to find in ArenaUsers and create analyst from it
      const arenaUser = await this.arenaUserModel.findOne({ 
        wallet: { $regex: new RegExp(`^${normalizedWallet}$`, 'i') }
      }).exec();
      
      if (arenaUser) {
        // Create analyst from ArenaUser data
        analyst = new this.analystModel({
          wallet: normalizedWallet,
          username: arenaUser.username || `Analyst_${wallet.slice(2, 8)}`,
          xp: arenaUser.xp || 0,
          leaguePoints: arenaUser.leaguePoints || 0,
          tier: arenaUser.tier || 'bronze',
          stats: arenaUser.stats || { totalPredictions: 0, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 },
          performance: { roi: Number(arenaUser.stats?.roi) || 0, accuracy: Number(arenaUser.stats?.accuracy) || 0, totalStake: arenaUser.stats?.totalStaked || 0, totalProfit: arenaUser.stats?.totalProfit || 0 },
          duelStats: arenaUser.duelStats || { wins: 0, losses: 0, totalPot: 0, winnings: 0 },
        });
        await analyst.save();
        this.logger.log(`Created analyst from ArenaUser: ${wallet}`);
      } else {
        // Create new analyst
        analyst = new this.analystModel({
          wallet: normalizedWallet,
          username: `Analyst_${wallet.slice(2, 8)}`,
          stats: { totalPredictions: 0, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 },
          performance: { roi: 0, accuracy: 0, totalStake: 0, totalProfit: 0 },
          duelStats: { wins: 0, losses: 0, totalPot: 0, winnings: 0 },
        });
        await analyst.save();
        this.logger.log(`Created new analyst: ${wallet}`);
      }
    }
    
    return analyst;
  }

  /**
   * Get analyst profile
   */
  async getProfile(wallet: string): Promise<AnalystProfileResponse> {
    const analyst = await this.getOrCreate(wallet);
    
    // Get current season rank
    let rank = 0;
    try {
      const snapshot = await this.seasonsService.getSeasonSnapshot(wallet);
      rank = snapshot.rank;
    } catch (e) {
      // No season stats yet
    }

    const totalPredictions = analyst.stats?.totalPredictions || 0;
    const wins = analyst.stats?.wins || 0;
    const losses = analyst.stats?.losses || 0;
    const winRate = totalPredictions > 0 ? Math.round((wins / totalPredictions) * 100) : 0;

    const duelWins = analyst.duelStats?.wins || 0;
    const duelLosses = analyst.duelStats?.losses || 0;
    const duelWinRate = (duelWins + duelLosses) > 0 ? Math.round((duelWins / (duelWins + duelLosses)) * 100) : 0;

    return {
      wallet: analyst.wallet,
      username: analyst.username || `Analyst_${wallet.slice(2, 8)}`,
      avatar: analyst.avatar || '',
      bio: analyst.bio || '',
      rank,
      tier: analyst.tier || 'bronze',
      badges: analyst.badges || [],
      verified: analyst.verified || false,
      xp: analyst.xp || 0,
      stats: {
        totalPredictions,
        currentStreak: analyst.stats?.currentStreak || 0,
        bestStreak: analyst.stats?.bestStreak || 0,
        winRate,
        wins,
        losses,
      },
      performance: {
        roi: analyst.performance?.roi || 0,
        accuracy: analyst.performance?.accuracy || 0,
        totalProfit: analyst.performance?.totalProfit || 0,
      },
      duelStats: {
        wins: duelWins,
        losses: duelLosses,
        winRate: duelWinRate,
      },
      createdAt: (analyst as any).createdAt,
    };
  }

  /**
   * Update analyst profile
   */
  async updateProfile(wallet: string, dto: UpdateAnalystDto): Promise<AnalystDocument> {
    const analyst = await this.getOrCreate(wallet);
    
    if (dto.username) analyst.username = dto.username;
    if (dto.avatar) analyst.avatar = dto.avatar;
    if (dto.bio) analyst.bio = dto.bio;
    
    return analyst.save();
  }

  /**
   * Update prediction stats
   */
  async updatePredictionStats(
    wallet: string,
    won: boolean,
    stake: number,
    profit: number,
  ): Promise<void> {
    const analyst = await this.getOrCreate(wallet);
    
    // Update stats
    analyst.stats.totalPredictions += 1;
    if (won) {
      analyst.stats.wins += 1;
      analyst.stats.currentStreak += 1;
      analyst.stats.bestStreak = Math.max(analyst.stats.bestStreak, analyst.stats.currentStreak);
    } else {
      analyst.stats.losses += 1;
      analyst.stats.currentStreak = 0;
    }
    
    // Update performance
    analyst.performance.totalStake += stake;
    analyst.performance.totalProfit += profit;
    analyst.performance.roi = analyst.performance.totalStake > 0
      ? (analyst.performance.totalProfit / analyst.performance.totalStake) * 100
      : 0;
    analyst.performance.accuracy = analyst.stats.totalPredictions > 0
      ? (analyst.stats.wins / analyst.stats.totalPredictions) * 100
      : 0;
    
    // Update XP
    const xpGain = won ? 50 + Math.floor(profit / 10) : 10;
    analyst.xp += xpGain;
    
    // Update tier based on XP
    analyst.tier = this.calculateTier(analyst.xp);
    
    await analyst.save();
    this.logger.log(`Updated prediction stats for ${wallet}: won=${won}, profit=${profit}`);
  }

  /**
   * Update duel stats
   */
  async updateDuelStats(
    wallet: string,
    won: boolean,
    pot: number,
    winnings: number,
  ): Promise<void> {
    const analyst = await this.getOrCreate(wallet);
    
    analyst.duelStats.totalPot += pot;
    if (won) {
      analyst.duelStats.wins += 1;
      analyst.duelStats.winnings += winnings;
      analyst.xp += 50;
    } else {
      analyst.duelStats.losses += 1;
      analyst.xp += 10;
    }
    
    analyst.tier = this.calculateTier(analyst.xp);
    await analyst.save();
    this.logger.log(`Updated duel stats for ${wallet}: won=${won}, winnings=${winnings}`);
  }

  /**
   * Get top predictions for analyst
   */
  async getTopPredictions(wallet: string, limit: number = 5): Promise<TopPredictionResponse[]> {
    // This would normally query the predictions collection
    // For now, return mock data structure
    return [];
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    sortBy: string = 'roi',
    limit: number = 20,
    cursor?: string,
  ): Promise<{ data: any[]; nextCursor?: string; hasMore: boolean }> {
    const sortField = sortBy === 'accuracy' ? 'performance.accuracy' 
      : sortBy === 'xp' ? 'xp' 
      : 'performance.roi';
    
    const query: any = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const analysts = await this.analystModel
      .find(query)
      .sort({ [sortField]: -1 })
      .limit(limit + 1)
      .lean()
      .exec();
    
    const hasMore = analysts.length > limit;
    const data = analysts.slice(0, limit).map((a, idx) => ({
      rank: idx + 1,
      wallet: a.wallet,
      username: a.username || `Analyst_${a.wallet.slice(2, 8)}`,
      avatar: a.avatar || '',
      roi: a.performance?.roi || 0,
      accuracy: a.performance?.accuracy || 0,
      xp: a.xp || 0,
      tier: a.tier || 'bronze',
      predictions: a.stats?.totalPredictions || 0,
      wins: a.stats?.wins || 0,
    }));
    
    return {
      data,
      nextCursor: hasMore && data.length > 0 ? analysts[limit - 1]._id.toString() : undefined,
      hasMore,
    };
  }

  /**
   * Calculate tier based on XP
   */
  private calculateTier(xp: number): string {
    if (xp >= 10000) return 'diamond';
    if (xp >= 5000) return 'platinum';
    if (xp >= 2000) return 'gold';
    if (xp >= 500) return 'silver';
    return 'bronze';
  }
}
