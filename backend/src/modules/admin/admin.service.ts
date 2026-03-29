import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prediction, PredictionDocument, PredictionStatus } from '../predictions/predictions.schema';
import { Analyst, AnalystDocument } from '../analysts/analysts.schema';
import { Position, PositionDocument, PositionStatus } from '../positions/positions.schema';
import { Duel, DuelDocument, DuelStatus } from '../duels/duels.schema';
import { Season, SeasonDocument, SeasonStatus } from '../seasons/seasons.schema';
import { CreateMarketDto, ResolveMarketDto, SimulateMarketDto, UpdateUserDto, CreateSeasonDto } from './admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(Analyst.name) private analystModel: Model<AnalystDocument>,
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    @InjectModel(Duel.name) private duelModel: Model<DuelDocument>,
    @InjectModel(Season.name) private seasonModel: Model<SeasonDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  // ==================== Dashboard Stats ====================

  async getStats(): Promise<any> {
    const [
      totalUsers,
      activeMarkets,
      totalVolume,
      activeDuels,
      openPositions,
      recentActivity,
    ] = await Promise.all([
      this.analystModel.countDocuments(),
      this.predictionModel.countDocuments({ status: { $in: ['published', 'locked'] } }),
      this.predictionModel.aggregate([
        { $match: { status: { $ne: 'draft' } } },
        { $group: { _id: null, total: { $sum: '$totalVolume' } } },
      ]),
      this.duelModel.countDocuments({ status: { $in: ['pending', 'active'] } }),
      this.positionModel.countDocuments({ status: 'open' }),
      this.getRecentActivityCount(),
    ]);

    return {
      totalUsers,
      activeMarkets,
      totalVolume: totalVolume[0]?.total || 0,
      activeDuels,
      openPositions,
      recentActivity,
      timestamp: new Date(),
    };
  }

  private async getRecentActivityCount(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activityCollection = this.connection.collection('activityevents');
    return activityCollection.countDocuments({ timestamp: { $gte: oneDayAgo } });
  }

  // ==================== Markets Management ====================

  async getMarkets(params: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.predictionModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.predictionModel.countDocuments(query),
    ]);

    return { 
      data: data.map(m => ({ ...m, id: m._id?.toString() })), 
      total 
    };
  }

  async getMarketById(id: string): Promise<any> {
    const market = await this.predictionModel.findById(id).lean().exec();
    if (!market) throw new NotFoundException('Market not found');
    
    // Get related stats
    const [positionsCount, volume] = await Promise.all([
      this.positionModel.countDocuments({ marketId: id }),
      this.positionModel.aggregate([
        { $match: { marketId: id } },
        { $group: { _id: null, total: { $sum: '$stake' } } },
      ]),
    ]);

    return {
      ...market,
      id: (market as any)._id?.toString(),
      positionsCount,
      actualVolume: volume[0]?.total || 0,
    };
  }

  async getPendingMarkets(): Promise<any[]> {
    const markets = await this.predictionModel
      .find({ status: { $in: ['draft', 'review', 'pending'] } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return markets.map(m => ({ ...m, id: (m as any)._id?.toString() }));
  }

  async createMarket(dto: CreateMarketDto, adminWallet: string): Promise<any> {
    const market = new this.predictionModel({
      question: dto.title,
      description: dto.description,
      category: dto.category,
      outcomes: dto.outcomes.map(o => ({
        id: o.id,
        label: o.label,
        probability: 50,
        yesMultiplier: 2.0,
        noMultiplier: 2.0,
      })),
      closeTime: dto.closeTime,
      riskLevel: dto.riskLevel || 'medium',
      type: dto.type || 'single',
      status: PredictionStatus.PUBLISHED, // Admin creates as published
      createdBy: adminWallet,
      totalVolume: dto.initialLiquidity || 0,
    });

    const saved = await market.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async updateMarket(id: string, dto: Partial<CreateMarketDto>): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    Object.assign(market, {
      question: dto.title || market.question,
      description: dto.description ?? market.description,
      category: dto.category || market.category,
      closeTime: dto.closeTime || market.closeTime,
      riskLevel: dto.riskLevel || market.riskLevel,
    });

    const saved = await market.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async approveMarket(id: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    market.status = PredictionStatus.PUBLISHED;
    const saved = await market.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async rejectMarket(id: string, reason?: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    market.status = PredictionStatus.CANCELED;
    market.resolutionSource = reason || 'Rejected by admin';
    const saved = await market.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async lockMarket(id: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    if (market.status !== PredictionStatus.PUBLISHED) {
      throw new BadRequestException('Can only lock published markets');
    }

    market.status = PredictionStatus.LOCKED;
    const saved = await market.save();
    
    this.logger.log(`Market ${id} locked by admin`);
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async resolveMarket(id: string, dto: ResolveMarketDto): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    if (market.status !== PredictionStatus.LOCKED) {
      throw new BadRequestException('Can only resolve locked markets');
    }

    // Validate winning outcome
    const validOutcome = market.outcomes.find(
      o => o.id === dto.winningOutcome || o.label === dto.winningOutcome
    );
    if (!validOutcome) {
      throw new BadRequestException('Invalid winning outcome');
    }

    market.status = PredictionStatus.RESOLVED;
    market.winningOutcome = dto.winningOutcome;
    market.resolutionSource = dto.resolutionNote || 'Admin resolution';
    market.resolvedAt = new Date();
    
    const saved = await market.save();

    // TODO: Trigger resolution cascade (positions, payouts, duels, etc.)
    this.logger.log(`Market ${id} resolved with outcome: ${dto.winningOutcome}`);
    
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async simulateMarket(id: string, dto: SimulateMarketDto): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    // Get all positions for this market
    const positions = await this.positionModel.find({ marketId: id }).lean().exec();

    // Find winning outcome label
    const winningOutcome = market.outcomes.find(o => o.id === dto.outcomeId || o.label === dto.outcomeId);
    const winnerLabel = winningOutcome?.label || dto.outcomeId;

    const winningPositions = positions.filter(p => 
      p.outcomeId === dto.outcomeId || p.outcomeLabel === dto.outcomeId
    );
    const losingPositions = positions.filter(p => 
      p.outcomeId !== dto.outcomeId && p.outcomeLabel !== dto.outcomeId
    );

    // Calculate detailed payouts
    const payoutDetails = winningPositions.map(p => ({
      user: (p as any).wallet,
      stake: p.stake,
      odds: p.odds || 2,
      payout: Math.round(p.stake * (p.odds || 2) * 100) / 100,
      profit: Math.round((p.stake * (p.odds || 2) - p.stake) * 100) / 100,
    }));

    const totalWinningStake = winningPositions.reduce((sum, p) => sum + p.stake, 0);
    const totalLosingStake = losingPositions.reduce((sum, p) => sum + p.stake, 0);
    const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);
    const fees = Math.round(totalStake * 0.03 * 100) / 100; // 3% fee

    const payoutTotal = payoutDetails.reduce((sum, p) => sum + p.payout, 0);
    const profitTotal = payoutDetails.reduce((sum, p) => sum + p.profit, 0);

    // Platform balance calculation
    const platformProfit = totalLosingStake - profitTotal + fees;

    return {
      marketId: id,
      marketTitle: market.question,
      simulatedOutcome: {
        id: dto.outcomeId,
        label: winnerLabel,
      },
      summary: {
        totalStake,
        totalWinningStake,
        totalLosingStake,
        payoutTotal: Math.round(payoutTotal * 100) / 100,
        fees,
        platformProfit: Math.round(platformProfit * 100) / 100,
      },
      winningPositions: winningPositions.length,
      losingPositions: losingPositions.length,
      positions: payoutDetails.slice(0, 50), // Limit to first 50 for display
      warnings: totalStake === 0 ? ['No positions found for this market'] : [],
    };
  }

  async deleteMarket(id: string): Promise<void> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    // Only allow deletion of draft/canceled markets
    if (!['draft', 'canceled'].includes(market.status)) {
      throw new BadRequestException('Can only delete draft or canceled markets');
    }

    await this.predictionModel.findByIdAndDelete(id);
    this.logger.log(`Market ${id} deleted by admin`);
  }

  // ==================== Users Management ====================

  async getUsers(params: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { wallet: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.analystModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.analystModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.analystModel.findOne({ 
      $or: [{ _id: id }, { wallet: id }] 
    }).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    // Get user's positions count
    const positionsCount = await this.positionModel.countDocuments({ wallet: (user as any).wallet });
    const duelsCount = await this.duelModel.countDocuments({ 
      $or: [{ challengerWallet: (user as any).wallet }, { opponentWallet: (user as any).wallet }] 
    });

    return { ...user, positionsCount, duelsCount };
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<any> {
    const user = await this.analystModel.findOne({ 
      $or: [{ _id: id }, { wallet: id }] 
    });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    return user.save();
  }

  async banUser(id: string): Promise<any> {
    const user = await this.analystModel.findOne({ 
      $or: [{ _id: id }, { wallet: id }] 
    });
    if (!user) throw new NotFoundException('User not found');

    (user as any).banned = true;
    return user.save();
  }

  async unbanUser(id: string): Promise<any> {
    const user = await this.analystModel.findOne({ 
      $or: [{ _id: id }, { wallet: id }] 
    });
    if (!user) throw new NotFoundException('User not found');

    (user as any).banned = false;
    return user.save();
  }

  // ==================== Positions Management ====================

  async getPositions(params: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, status, marketId, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const query: any = {};
    if (status) query.status = status;
    if (marketId) query.marketId = marketId;

    const [data, total] = await Promise.all([
      this.positionModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.positionModel.countDocuments(query),
    ]);

    return { data, total };
  }

  // ==================== Duels Management ====================

  async getDuels(params: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const query: any = {};
    if (status) query.status = status;

    const [data, total] = await Promise.all([
      this.duelModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.duelModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async resolveDuel(id: string, winnerId: string): Promise<any> {
    const duel = await this.duelModel.findById(id);
    if (!duel) throw new NotFoundException('Duel not found');

    duel.status = DuelStatus.FINISHED;
    duel.winnerWallet = winnerId;
    duel.resolvedAt = new Date();
    
    return duel.save();
  }

  async cancelDuel(id: string): Promise<any> {
    const duel = await this.duelModel.findById(id);
    if (!duel) throw new NotFoundException('Duel not found');

    duel.status = DuelStatus.CANCELED;
    return duel.save();
  }

  // ==================== Seasons Management ====================

  async getSeasons(): Promise<any[]> {
    return this.seasonModel.find().sort({ startDate: -1 }).lean().exec();
  }

  async createSeason(dto: CreateSeasonDto): Promise<any> {
    const season = new this.seasonModel({
      seasonId: `S_${Date.now()}`,
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: 'upcoming',
      totalParticipants: 0,
      totalVolume: 0,
    });
    return season.save();
  }

  async startSeason(id: string): Promise<any> {
    const season = await this.seasonModel.findById(id);
    if (!season) throw new NotFoundException('Season not found');

    season.status = SeasonStatus.ACTIVE;
    return season.save();
  }

  async endSeason(id: string): Promise<any> {
    const season = await this.seasonModel.findById(id);
    if (!season) throw new NotFoundException('Season not found');

    season.status = SeasonStatus.ENDED;
    return season.save();
  }

  // ==================== Activity Monitor ====================

  async getActivity(params: any): Promise<any[]> {
    const limitParam = params?.limit;
    const limit = typeof limitParam === 'number' ? limitParam : parseInt(limitParam) || 50;
    const activityCollection = this.connection.collection('activityevents');
    
    return activityCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // ==================== Risk Monitor ====================

  async getRiskMonitor(): Promise<any[]> {
    // Find markets with high concentration
    const markets = await this.predictionModel
      .find({ status: { $in: ['published', 'locked'] } })
      .lean()
      .exec();

    const riskData = await Promise.all(
      markets.map(async (market) => {
        const positions = await this.positionModel
          .find({ marketId: (market as any)._id.toString() })
          .lean()
          .exec();

        const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);
        const maxPosition = Math.max(...positions.map(p => p.stake), 0);
        const concentration = totalStake > 0 ? (maxPosition / totalStake) * 100 : 0;

        return {
          marketId: (market as any)._id.toString(),
          title: market.question,
          totalStake,
          positionsCount: positions.length,
          maxPosition,
          concentration: concentration.toFixed(1),
          riskLevel: concentration > 50 ? 'HIGH' : concentration > 25 ? 'MEDIUM' : 'LOW',
        };
      })
    );

    return riskData.filter(r => r.positionsCount > 0).sort((a, b) => 
      parseFloat(b.concentration) - parseFloat(a.concentration)
    );
  }

  async getWhaleBets(): Promise<any[]> {
    const positions = await this.positionModel
      .find({ status: 'open' })
      .sort({ stake: -1 })
      .limit(50)
      .lean()
      .exec();

    const whaleBets = [];
    for (const pos of positions) {
      const market = await this.predictionModel.findById(pos.marketId).lean().exec();
      if (!market) continue;

      const marketPositions = await this.positionModel.find({ marketId: pos.marketId }).lean().exec();
      const totalLiquidity = marketPositions.reduce((sum, p) => sum + p.stake, 0);
      const percentage = totalLiquidity > 0 ? (pos.stake / totalLiquidity) * 100 : 0;

      if (percentage >= 20) {
        whaleBets.push({
          positionId: (pos as any)._id.toString(),
          wallet: pos.wallet,
          marketId: pos.marketId,
          marketTitle: market.question,
          stake: pos.stake,
          totalLiquidity,
          percentage: percentage.toFixed(1),
          createdAt: (pos as any).createdAt,
        });
      }
    }

    return whaleBets.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  }

  async getSkewedMarkets(): Promise<any[]> {
    const markets = await this.predictionModel
      .find({ status: { $in: ['published', 'locked'] } })
      .lean()
      .exec();

    const skewedMarkets = [];
    for (const market of markets) {
      const positions = await this.positionModel
        .find({ marketId: (market as any)._id.toString() })
        .lean()
        .exec();

      if (positions.length === 0) continue;

      // Calculate stake per outcome
      const outcomeStakes: Record<string, number> = {};
      for (const pos of positions) {
        const outcomeKey = pos.outcomeId || pos.outcomeLabel || 'unknown';
        outcomeStakes[outcomeKey] = (outcomeStakes[outcomeKey] || 0) + pos.stake;
      }

      const totalStake = Object.values(outcomeStakes).reduce((a, b) => a + b, 0);
      const maxStake = Math.max(...Object.values(outcomeStakes));
      const skewPercentage = totalStake > 0 ? (maxStake / totalStake) * 100 : 0;

      if (skewPercentage >= 85) {
        const dominantOutcome = Object.entries(outcomeStakes).find(([_, v]) => v === maxStake)?.[0];
        skewedMarkets.push({
          marketId: (market as any)._id.toString(),
          title: market.question,
          status: market.status,
          totalStake,
          dominantOutcome,
          dominantStake: maxStake,
          skewPercentage: skewPercentage.toFixed(1),
          outcomeBreakdown: outcomeStakes,
        });
      }
    }

    return skewedMarkets.sort((a, b) => parseFloat(b.skewPercentage) - parseFloat(a.skewPercentage));
  }

  async getSuspiciousUsers(): Promise<any[]> {
    // Find users with anomalous activity
    const analysts = await this.analystModel.find().lean().exec();

    const suspicious = [];
    for (const analyst of analysts) {
      const positions = await this.positionModel
        .find({ wallet: analyst.wallet?.toLowerCase() })
        .lean()
        .exec();

      const totalBets = positions.length;
      const wins = positions.filter(p => p.status === 'won').length;
      const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

      // Suspicious if: high win rate with many bets OR unusual volume
      const totalVolume = positions.reduce((sum, p) => sum + p.stake, 0);
      const isSuspicious = (winRate > 80 && totalBets > 5) || totalVolume > 10000;

      if (isSuspicious) {
        suspicious.push({
          wallet: analyst.wallet,
          username: analyst.username,
          totalBets,
          wins,
          losses: totalBets - wins,
          winRate: winRate.toFixed(1),
          totalVolume,
          flags: [
            ...(winRate > 80 && totalBets > 5 ? ['High win rate'] : []),
            ...(totalVolume > 10000 ? ['High volume'] : []),
          ],
        });
      }
    }

    return suspicious.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  }

  // ==================== Resolution Center ====================

  async getMarketsForResolution(): Promise<any[]> {
    const now = new Date();
    const markets = await this.predictionModel
      .find({
        status: { $in: ['published', 'locked'] },
        closeTime: { $lte: now },
      })
      .sort({ closeTime: 1 })
      .lean()
      .exec();

    return Promise.all(markets.map(async (market) => {
      const positions = await this.positionModel.find({ marketId: (market as any)._id.toString() }).lean().exec();
      const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);

      return {
        id: (market as any)._id.toString(),
        title: market.question,
        status: market.status,
        closeTime: market.closeTime,
        outcomes: market.outcomes,
        oracleResult: market.winningOutcome || null,
        confirmedOutcome: (market as any).confirmedOutcome || null,
        totalStake,
        positionsCount: positions.length,
        isOverdue: market.closeTime < new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
    }));
  }

  async confirmOracle(id: string, outcomeId: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    // Validate outcome
    const validOutcome = market.outcomes.find(o => o.id === outcomeId || o.label === outcomeId);
    if (!validOutcome) throw new BadRequestException('Invalid outcome');

    // Store confirmed outcome (not yet resolved)
    (market as any).confirmedOutcome = outcomeId;
    (market as any).confirmedAt = new Date();
    await market.save();

    this.logger.log(`Market ${id} oracle confirmed: ${outcomeId}`);
    return { ...market.toObject(), id: market._id.toString() };
  }

  async overrideResult(id: string, outcomeId: string, reason: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    const validOutcome = market.outcomes.find(o => o.id === outcomeId || o.label === outcomeId);
    if (!validOutcome) throw new BadRequestException('Invalid outcome');

    (market as any).confirmedOutcome = outcomeId;
    (market as any).overrideReason = reason;
    (market as any).overrideAt = new Date();
    await market.save();

    this.logger.log(`Market ${id} outcome overridden to ${outcomeId}: ${reason}`);
    return { ...market.toObject(), id: market._id.toString() };
  }

  async finalizeResolution(id: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    const confirmedOutcome = (market as any).confirmedOutcome;
    if (!confirmedOutcome) {
      throw new BadRequestException('No confirmed outcome. Please confirm or override first.');
    }

    // Lock market if not already locked
    if (market.status === PredictionStatus.PUBLISHED) {
      market.status = PredictionStatus.LOCKED;
    }

    // Resolve market
    market.status = PredictionStatus.RESOLVED;
    market.winningOutcome = confirmedOutcome;
    market.resolvedAt = new Date();
    await market.save();

    // Get and resolve positions
    const positions = await this.positionModel.find({ marketId: id }).exec();
    let payoutTotal = 0;
    let winnersCount = 0;
    let losersCount = 0;

    for (const pos of positions) {
      const won = pos.outcomeId === confirmedOutcome || pos.outcomeLabel === confirmedOutcome;
      const payout = won ? pos.potentialReturn : 0;
      
      pos.status = won ? PositionStatus.WON : PositionStatus.LOST;
      (pos as any).payout = payout;
      (pos as any).profit = won ? payout - pos.stake : -pos.stake;
      pos.resolvedAt = new Date();
      await pos.save();

      if (won) {
        payoutTotal += payout;
        winnersCount++;
      } else {
        losersCount++;
      }
    }

    this.logger.log(`Market ${id} finalized. Winners: ${winnersCount}, Losers: ${losersCount}, Payout: ${payoutTotal}`);

    return {
      market: { ...market.toObject(), id: market._id.toString() },
      resolution: {
        winnersCount,
        losersCount,
        payoutTotal,
        timestamp: new Date(),
      },
    };
  }

  async pauseMarket(id: string): Promise<any> {
    const market = await this.predictionModel.findById(id);
    if (!market) throw new NotFoundException('Market not found');

    market.status = PredictionStatus.LOCKED;
    (market as any).pausedAt = new Date();
    await market.save();

    this.logger.log(`Market ${id} paused by admin`);
    return { ...market.toObject(), id: market._id.toString() };
  }

  async freezeUserByWallet(wallet: string): Promise<any> {
    const analyst = await this.analystModel.findOne({ wallet: wallet.toLowerCase() });
    if (!analyst) throw new NotFoundException('User not found');

    (analyst as any).frozen = true;
    (analyst as any).frozenAt = new Date();
    await analyst.save();

    this.logger.log(`User ${wallet} frozen`);
    return { wallet, frozen: true };
  }

  // ==================== Auto-Close Markets Scheduler ====================
  
  /**
   * Automatically lock markets when their event date (closeTime) has passed.
   * Runs every minute to check for expired markets.
   * Markets transition: PUBLISHED -> LOCKED (pending admin resolution)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoLockExpiredMarkets(): Promise<void> {
    const now = new Date();
    
    try {
      // Find all published markets where the event date has passed
      const expiredMarkets = await this.predictionModel.find({
        status: PredictionStatus.PUBLISHED,
        closeTime: { $lte: now },
      }).exec();

      if (expiredMarkets.length === 0) {
        return; // No markets to lock
      }

      this.logger.log(`Found ${expiredMarkets.length} markets to auto-lock`);

      for (const market of expiredMarkets) {
        market.status = PredictionStatus.LOCKED;
        (market as any).autoLockedAt = now;
        await market.save();
        
        this.logger.log(`Auto-locked market: ${(market as any)._id} - "${market.question}"`);
      }
    } catch (error) {
      this.logger.error(`Auto-lock markets failed: ${error.message}`);
    }
  }

  /**
   * Get count of markets pending admin resolution (locked but not resolved)
   */
  async getPendingResolutionCount(): Promise<number> {
    return this.predictionModel.countDocuments({
      status: PredictionStatus.LOCKED,
    });
  }
}
