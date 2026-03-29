import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Boost, BoostDocument, BoostType, BoostStatus } from './boost.schema';
import { Position, PositionDocument } from '../positions/positions.schema';
import { Duel, DuelDocument, DuelStatus } from '../duels/duels.schema';
import { Analyst, AnalystDocument } from '../analysts/analysts.schema';
import { Prediction, PredictionDocument } from '../predictions/predictions.schema';

// Helper to validate ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

export interface PricingInfo {
  betBoost: {
    base: number;
    description: string;
  };
  duelFeatured: {
    base: number;
    description: string;
  };
  platformFee: {
    base: number;
    dynamic: {
      low: number;
      medium: number;
      high: number;
    };
  };
  duelFee: {
    base: number;
    dynamic: {
      low: number;
      high: number;
    };
  };
  creatorFee: number;
}

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  // Pricing constants
  private readonly BET_BOOST_BASE = 1; // $1 to boost bet
  private readonly DUEL_FEATURED_BASE = 2; // $2 for featured duel
  private readonly PLATFORM_FEE_BASE = 200; // 2% base fee (in basis points)
  private readonly DUEL_FEE_BASE = 500; // 5% base duel fee
  private readonly CREATOR_FEE = 100; // 1% creator fee

  constructor(
    @InjectModel('Boost') private boostModel: Model<BoostDocument>,
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    @InjectModel(Duel.name) private duelModel: Model<DuelDocument>,
    @InjectModel(Analyst.name) private analystModel: Model<AnalystDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Boost a bet for visibility in activity feed
   */
  async boostBet(wallet: string, betId: string, boostAmount: number): Promise<any> {
    // Validate betId format
    if (!isValidObjectId(betId)) {
      throw new BadRequestException('Invalid bet ID format');
    }

    // Validate bet exists and belongs to user
    const position = await this.positionModel.findById(betId).lean().exec();
    if (!position) {
      throw new NotFoundException('Bet not found');
    }
    if (position.wallet !== wallet.toLowerCase()) {
      throw new BadRequestException('Not your bet');
    }

    // Validate amount
    if (boostAmount < this.BET_BOOST_BASE) {
      throw new BadRequestException(`Minimum boost amount is $${this.BET_BOOST_BASE}`);
    }

    // Check for existing active boost
    const existingBoost = await this.boostModel.findOne({
      type: BoostType.BET,
      targetId: betId,
      status: BoostStatus.ACTIVE,
    }).exec();

    if (existingBoost) {
      throw new BadRequestException('Bet already boosted');
    }

    // Create boost
    const boost = await this.boostModel.create({
      type: BoostType.BET,
      targetId: betId,
      wallet: wallet.toLowerCase(),
      amount: boostAmount,
      status: BoostStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Award XP for boost
    await this.analystModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $inc: { xp: 10 } }
    );

    this.logger.log(`Bet boosted: ${betId} by ${wallet} for $${boostAmount}`);

    return {
      boostId: (boost as any)._id.toString(),
      targetId: betId,
      amount: boostAmount,
      expiresAt: boost.expiresAt,
      benefits: [
        'Highlighted in activity feed',
        'Shown in whale/FOMO section',
        'Higher visibility for 24 hours'
      ],
    };
  }

  /**
   * Feature a duel for visibility
   */
  async featureDuel(wallet: string, duelId: string, boostAmount: number): Promise<any> {
    // Validate duelId format
    if (!isValidObjectId(duelId)) {
      throw new BadRequestException('Invalid duel ID format');
    }

    // Validate duel exists
    const duel = await this.duelModel.findById(duelId).lean().exec();
    if (!duel) {
      throw new NotFoundException('Duel not found');
    }

    // Validate user is part of duel
    if (duel.creatorWallet !== wallet.toLowerCase() && duel.opponentWallet !== wallet.toLowerCase()) {
      throw new BadRequestException('You are not part of this duel');
    }

    // Validate duel is active
    if (duel.status !== DuelStatus.PENDING && duel.status !== DuelStatus.ACTIVE) {
      throw new BadRequestException('Duel is not active');
    }

    // Validate amount
    if (boostAmount < this.DUEL_FEATURED_BASE) {
      throw new BadRequestException(`Minimum featured amount is $${this.DUEL_FEATURED_BASE}`);
    }

    // Check for existing boost
    const existingBoost = await this.boostModel.findOne({
      type: BoostType.DUEL,
      targetId: duelId,
      status: BoostStatus.ACTIVE,
    }).exec();

    if (existingBoost) {
      throw new BadRequestException('Duel already featured');
    }

    // Create boost
    const boost = await this.boostModel.create({
      type: BoostType.DUEL,
      targetId: duelId,
      wallet: wallet.toLowerCase(),
      amount: boostAmount,
      status: BoostStatus.ACTIVE,
      featured: true,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    });

    // Award XP for featuring
    await this.analystModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $inc: { xp: 15 } }
    );

    this.logger.log(`Duel featured: ${duelId} by ${wallet} for $${boostAmount}`);

    return {
      boostId: (boost as any)._id.toString(),
      targetId: duelId,
      amount: boostAmount,
      featured: true,
      expiresAt: boost.expiresAt,
      benefits: [
        'Featured in duels section',
        'Higher visibility',
        'Featured badge shown',
        'Priority in duel feed'
      ],
    };
  }

  /**
   * Get boosted bets for activity feed
   */
  async getBoostedBets(limit: number = 10): Promise<any[]> {
    const boosts = await this.boostModel
      .find({
        type: BoostType.BET,
        status: BoostStatus.ACTIVE,
        expiresAt: { $gt: new Date() }
      })
      .sort({ amount: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    const boostedBets = [];
    for (const boost of boosts) {
      const position = await this.positionModel.findById(boost.targetId).lean().exec();
      if (position) {
        const market = await this.predictionModel.findById(position.marketId).lean().exec();
        boostedBets.push({
          boost: {
            id: (boost as any)._id.toString(),
            amount: boost.amount,
            expiresAt: boost.expiresAt,
          },
          bet: {
            id: (position as any)._id.toString(),
            wallet: position.wallet,
            shortWallet: `${position.wallet.slice(0, 6)}...${position.wallet.slice(-4)}`,
            stake: position.stake,
            odds: position.odds,
            outcome: position.outcomeLabel,
            marketId: position.marketId,
            marketTitle: market?.question || 'Market',
          },
          boosted: true,
        });
      }
    }

    return boostedBets;
  }

  /**
   * Get featured duels
   */
  async getFeaturedDuels(limit: number = 5): Promise<any[]> {
    const boosts = await this.boostModel
      .find({
        type: BoostType.DUEL,
        status: BoostStatus.ACTIVE,
        featured: true,
        expiresAt: { $gt: new Date() }
      })
      .sort({ amount: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    const featuredDuels = [];
    for (const boost of boosts) {
      const duel = await this.duelModel.findById(boost.targetId).lean().exec();
      if (duel && (duel.status === DuelStatus.PENDING || duel.status === DuelStatus.ACTIVE)) {
        featuredDuels.push({
          boost: {
            id: (boost as any)._id.toString(),
            amount: boost.amount,
            expiresAt: boost.expiresAt,
          },
          duel: {
            id: (duel as any)._id.toString(),
            creatorWallet: duel.creatorWallet,
            opponentWallet: duel.opponentWallet,
            stakeAmount: duel.stakeAmount,
            totalPot: duel.totalPot || duel.stakeAmount * 2,
            status: duel.status,
            predictionTitle: duel.predictionTitle,
          },
          featured: true,
        });
      }
    }

    return featuredDuels;
  }

  /**
   * Get pricing info
   */
  getPricing(): PricingInfo {
    return {
      betBoost: {
        base: this.BET_BOOST_BASE,
        description: 'Highlight your bet in activity feed for 24 hours',
      },
      duelFeatured: {
        base: this.DUEL_FEATURED_BASE,
        description: 'Make your duel featured for 48 hours',
      },
      platformFee: {
        base: this.PLATFORM_FEE_BASE / 100, // Convert to percentage
        dynamic: {
          low: 2.0,
          medium: 2.5,
          high: 3.0,
        },
      },
      duelFee: {
        base: this.DUEL_FEE_BASE / 100, // Convert to percentage
        dynamic: {
          low: 5.0,
          high: 7.0,
        },
      },
      creatorFee: this.CREATOR_FEE / 100, // 1%
    };
  }

  /**
   * Get monetization stats
   */
  async getStats(): Promise<any> {
    const totalBoosts = await this.boostModel.countDocuments();
    const activeBoosts = await this.boostModel.countDocuments({ 
      status: BoostStatus.ACTIVE,
      expiresAt: { $gt: new Date() }
    });

    const totalBoostRevenue = await this.boostModel.aggregate([
      { $match: {} },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Estimate platform fees from positions
    const positionStats = await this.positionModel.aggregate([
      { $group: { 
        _id: null, 
        totalVolume: { $sum: '$stake' },
        totalFees: { $sum: '$fee' }
      }}
    ]);

    return {
      boosts: {
        total: totalBoosts,
        active: activeBoosts,
        revenue: totalBoostRevenue[0]?.total || 0,
      },
      platformFees: {
        totalVolume: positionStats[0]?.totalVolume || 0,
        totalFees: positionStats[0]?.totalFees || 0,
      },
    };
  }

  /**
   * Get user's boost history
   */
  async getUserBoosts(wallet: string): Promise<any[]> {
    const boosts = await this.boostModel
      .find({ wallet: wallet.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    return boosts.map(b => ({
      id: (b as any)._id.toString(),
      type: b.type,
      targetId: b.targetId,
      amount: b.amount,
      status: b.status,
      featured: b.featured,
      createdAt: (b as any).createdAt,
      expiresAt: b.expiresAt,
    }));
  }

  /**
   * Get dynamic fee based on market FOMO level
   */
  async getDynamicFee(marketId: string): Promise<any> {
    const market = await this.predictionModel.findById(marketId).lean().exec();
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    // Calculate FOMO level based on various factors
    const volume = market.totalVolume || 0;
    const bets = market.totalBets || 0;
    
    // Simple FOMO calculation
    let fomoLevel = 'low';
    let platformFee = 2.0;
    let duelFee = 5.0;

    if (volume > 10000 || bets > 100) {
      fomoLevel = 'high';
      platformFee = 3.0;
      duelFee = 7.0;
    } else if (volume > 1000 || bets > 20) {
      fomoLevel = 'medium';
      platformFee = 2.5;
      duelFee = 6.0;
    }

    return {
      marketId,
      fomoLevel,
      platformFee,
      duelFee,
      creatorFee: this.CREATOR_FEE / 100,
      factors: {
        volume,
        bets,
      },
    };
  }

  /**
   * Expire old boosts (called by CRON)
   */
  async expireOldBoosts(): Promise<number> {
    const result = await this.boostModel.updateMany(
      {
        status: BoostStatus.ACTIVE,
        expiresAt: { $lt: new Date() }
      },
      { $set: { status: BoostStatus.EXPIRED } }
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Expired ${result.modifiedCount} boosts`);
    }

    return result.modifiedCount;
  }
}
