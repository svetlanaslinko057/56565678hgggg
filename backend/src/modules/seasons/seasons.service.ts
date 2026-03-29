import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Season, SeasonDocument, SeasonStatus } from './seasons.schema';
import { SeasonStats, SeasonStatsDocument } from './season-stats.schema';
import { CreateSeasonDto, SeasonSnapshotResponse, LeaderboardEntryResponse, ProfitLeaderboardEntry } from './seasons.dto';

// League Points calculation constants
const DUEL_WIN_POINTS = 50;
const DUEL_LOSS_POINTS = -20;
const ACCURACY_BONUS_70 = 200;
const ACCURACY_BONUS_80 = 500;
const ACCURACY_BONUS_90 = 1000;

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    @InjectModel(Season.name)
    private seasonModel: Model<SeasonDocument>,
    @InjectModel(SeasonStats.name)
    private seasonStatsModel: Model<SeasonStatsDocument>,
  ) {}

  /**
   * Create a new season
   */
  async createSeason(dto: CreateSeasonDto): Promise<Season> {
    const season = new this.seasonModel({
      seasonId: dto.seasonId,
      name: dto.name,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: SeasonStatus.UPCOMING,
    });
    
    const saved = await season.save();
    this.logger.log(`Created season: ${dto.seasonId}`);
    return saved;
  }

  /**
   * Get current active season
   */
  async getCurrentSeason(): Promise<SeasonDocument | null> {
    const now = new Date();
    
    // First try to find active season
    let season = await this.seasonModel.findOne({ status: SeasonStatus.ACTIVE }).exec();
    
    if (!season) {
      // Auto-activate upcoming season if start date passed
      season = await this.seasonModel.findOne({
        status: SeasonStatus.UPCOMING,
        startDate: { $lte: now },
      }).exec();
      
      if (season) {
        season.status = SeasonStatus.ACTIVE;
        await season.save();
      }
    }
    
    // Check if current active season has ended
    if (season && new Date(season.endDate) < now) {
      season.status = SeasonStatus.ENDED;
      await season.save();
      season = null;
    }
    
    return season;
  }

  /**
   * Get or create season stats for a user
   */
  async getOrCreateSeasonStats(wallet: string, seasonId?: string): Promise<SeasonStatsDocument> {
    let season = seasonId 
      ? await this.seasonModel.findOne({ seasonId }).exec()
      : await this.getCurrentSeason();
    
    if (!season) {
      // Create default season if none exists
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      
      season = await this.createSeason({
        seasonId: `Q${Math.ceil((now.getMonth() + 1) / 3)}_${now.getFullYear()}`,
        name: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
        startDate: now,
        endDate: endDate,
      }) as SeasonDocument;
      
      season.status = SeasonStatus.ACTIVE;
      await season.save();
    }
    
    let stats = await this.seasonStatsModel.findOne({
      seasonId: season.seasonId,
      wallet,
    }).exec();
    
    if (!stats) {
      stats = new this.seasonStatsModel({
        seasonId: season.seasonId,
        wallet,
        leaguePoints: 0,
        roi: 0,
        accuracy: 0,
        predictions: 0,
        wins: 0,
        losses: 0,
        totalStake: 0,
        totalProfit: 0,
        duelWins: 0,
        duelLosses: 0,
        duelWinnings: 0,
        rank: 0,
      });
      await stats.save();
      
      // Update season participant count
      season.totalParticipants += 1;
      await season.save();
    }
    
    return stats;
  }

  /**
   * Update season stats after prediction resolution
   */
  async updatePredictionStats(
    wallet: string,
    won: boolean,
    stake: number,
    profit: number,
  ): Promise<void> {
    const stats = await this.getOrCreateSeasonStats(wallet);
    
    stats.predictions += 1;
    stats.totalStake += stake;
    stats.totalProfit += profit;
    
    if (won) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }
    
    // Recalculate ROI and accuracy
    stats.roi = stats.totalStake > 0 ? (stats.totalProfit / stats.totalStake) * 100 : 0;
    stats.accuracy = stats.predictions > 0 ? (stats.wins / stats.predictions) * 100 : 0;
    
    // Recalculate league points
    stats.leaguePoints = this.calculateLeaguePoints(stats);
    stats.lastUpdated = new Date();
    
    await stats.save();
    this.logger.log(`Updated season stats for ${wallet}: predictions=${stats.predictions}, roi=${stats.roi.toFixed(2)}%`);
  }

  /**
   * Update season stats after duel resolution
   */
  async updateDuelStats(
    wallet: string,
    won: boolean,
    winnings: number,
  ): Promise<void> {
    const stats = await this.getOrCreateSeasonStats(wallet);
    
    if (won) {
      stats.duelWins += 1;
      stats.duelWinnings += winnings;
    } else {
      stats.duelLosses += 1;
    }
    
    // Recalculate league points
    stats.leaguePoints = this.calculateLeaguePoints(stats);
    stats.lastUpdated = new Date();
    
    await stats.save();
    this.logger.log(`Updated duel stats for ${wallet}: duelWins=${stats.duelWins}, duelLosses=${stats.duelLosses}`);
  }

  /**
   * Calculate league points
   * LeaguePoints = predictionScore + duelScore + accuracyBonus
   */
  calculateLeaguePoints(stats: SeasonStatsDocument): number {
    // Prediction score (profit-based)
    const predictionScore = Math.max(0, stats.totalProfit);
    
    // Duel score
    const duelScore = (stats.duelWins * DUEL_WIN_POINTS) + (stats.duelLosses * DUEL_LOSS_POINTS);
    
    // Accuracy bonus
    let accuracyBonus = 0;
    if (stats.accuracy >= 90) {
      accuracyBonus = ACCURACY_BONUS_90;
    } else if (stats.accuracy >= 80) {
      accuracyBonus = ACCURACY_BONUS_80;
    } else if (stats.accuracy >= 70) {
      accuracyBonus = ACCURACY_BONUS_70;
    }
    
    return Math.max(0, Math.round(predictionScore + duelScore + accuracyBonus));
  }

  /**
   * Recalculate user stats from positions (called after resolution)
   */
  async recalculateUserStats(wallet: string): Promise<void> {
    const stats = await this.getOrCreateSeasonStats(wallet);
    
    // Recalculate ROI
    stats.roi = stats.totalStake > 0 ? (stats.totalProfit / stats.totalStake) * 100 : 0;
    
    // Recalculate accuracy
    const totalPredictions = stats.wins + stats.losses;
    stats.accuracy = totalPredictions > 0 ? (stats.wins / totalPredictions) * 100 : 0;
    
    // Recalculate league points
    stats.leaguePoints = this.calculateLeaguePoints(stats);
    stats.lastUpdated = new Date();
    
    await stats.save();
    this.logger.log(`Recalculated stats for ${wallet}: LP=${stats.leaguePoints}, ROI=${stats.roi.toFixed(2)}%`);
  }

  /**
   * Get season snapshot for user
   */
  async getSeasonSnapshot(wallet: string, seasonId?: string): Promise<SeasonSnapshotResponse> {
    const season = seasonId 
      ? await this.seasonModel.findOne({ seasonId }).exec()
      : await this.getCurrentSeason();
    
    if (!season) {
      throw new NotFoundException('No active season found');
    }
    
    const stats = await this.getOrCreateSeasonStats(wallet, season.seasonId);
    
    // Get rank by counting users with more league points
    const higherRanked = await this.seasonStatsModel.countDocuments({
      seasonId: season.seasonId,
      leaguePoints: { $gt: stats.leaguePoints },
    });
    
    const totalPlayers = await this.seasonStatsModel.countDocuments({
      seasonId: season.seasonId,
    });
    
    const rank = higherRanked + 1;
    const percentile = totalPlayers > 0 ? Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100) : 0;
    
    return {
      rank,
      totalPlayers,
      percentile,
      roi: Math.round(stats.roi * 10) / 10,
      accuracy: Math.round(stats.accuracy),
      leaguePoints: stats.leaguePoints,
      predictions: stats.predictions,
      wins: stats.wins,
      losses: stats.losses,
      duelWins: stats.duelWins,
      duelLosses: stats.duelLosses,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    seasonId?: string,
    sortBy: string = 'leaguePoints',
    limit: number = 20,
    cursor?: string,
  ): Promise<{ data: LeaderboardEntryResponse[]; nextCursor?: string; hasMore: boolean; total: number }> {
    const season = seasonId 
      ? await this.seasonModel.findOne({ seasonId }).exec()
      : await this.getCurrentSeason();
    
    if (!season) {
      return { data: [], hasMore: false, total: 0 };
    }
    
    const sortField = sortBy === 'roi' ? 'roi' 
      : sortBy === 'accuracy' ? 'accuracy' 
      : 'leaguePoints';
    
    const query: any = { seasonId: season.seasonId };
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const [statsData, total] = await Promise.all([
      this.seasonStatsModel
        .find(query)
        .sort({ [sortField]: -1 })
        .limit(limit + 1)
        .lean()
        .exec(),
      this.seasonStatsModel.countDocuments({ seasonId: season.seasonId }),
    ]);
    
    const hasMore = statsData.length > limit;
    const data = statsData.slice(0, limit).map((s, idx) => ({
      rank: idx + 1,
      wallet: s.wallet,
      username: `Analyst_${s.wallet.slice(2, 8)}`,
      avatar: '',
      roi: Math.round(s.roi * 10) / 10,
      accuracy: Math.round(s.accuracy),
      leaguePoints: s.leaguePoints,
      predictions: s.predictions,
      wins: s.wins,
    }));
    
    return {
      data,
      nextCursor: hasMore && statsData.length > 0 ? statsData[limit - 1]._id.toString() : undefined,
      hasMore,
      total,
    };
  }

  /**
   * Get profit leaderboard
   */
  async getProfitLeaderboard(
    seasonId?: string,
    limit: number = 20,
  ): Promise<ProfitLeaderboardEntry[]> {
    const season = seasonId 
      ? await this.seasonModel.findOne({ seasonId }).exec()
      : await this.getCurrentSeason();
    
    if (!season) {
      return [];
    }
    
    const statsData = await this.seasonStatsModel
      .find({ seasonId: season.seasonId })
      .sort({ totalProfit: -1 })
      .limit(limit)
      .lean()
      .exec();
    
    return statsData.map((s, idx) => ({
      rank: idx + 1,
      wallet: s.wallet,
      username: `Analyst_${s.wallet.slice(2, 8)}`,
      avatar: '',
      profit: s.totalProfit,
      positions: s.predictions,
      volume: s.totalStake,
    }));
  }

  /**
   * Recalculate all ranks for a season (rank worker)
   */
  async recalculateRanks(seasonId?: string): Promise<number> {
    const season = seasonId 
      ? await this.seasonModel.findOne({ seasonId }).exec()
      : await this.getCurrentSeason();
    
    if (!season) {
      return 0;
    }
    
    // Get all stats sorted by league points
    const allStats = await this.seasonStatsModel
      .find({ seasonId: season.seasonId })
      .sort({ leaguePoints: -1 })
      .exec();
    
    // Update ranks
    for (let i = 0; i < allStats.length; i++) {
      allStats[i].rank = i + 1;
      await allStats[i].save();
    }
    
    this.logger.log(`Recalculated ranks for ${allStats.length} participants in season ${season.seasonId}`);
    return allStats.length;
  }

  /**
   * Get all seasons
   */
  async getAllSeasons(): Promise<Season[]> {
    return this.seasonModel.find().sort({ startDate: -1 }).lean().exec();
  }

  /**
   * Get season by ID
   */
  async getSeasonById(seasonId: string): Promise<Season | null> {
    return this.seasonModel.findOne({ seasonId }).lean().exec();
  }
}
