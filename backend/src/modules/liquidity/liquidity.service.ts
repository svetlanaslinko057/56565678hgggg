import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketLiquidity, MarketLiquidityDocument, OutcomePool } from './liquidity.schema';
import { Prediction, PredictionDocument } from '../predictions/predictions.schema';
import { OddsSnapshot, OddsSnapshotDocument } from './odds-snapshot.schema';

export interface DynamicOdds {
  outcomeId: string;
  label: string;
  pool: number;
  probability: number;
  odds: number;
}

export interface AMMPreview {
  stake: number;
  outcomeId: string;
  odds: number;
  fee: number;
  potentialReturn: number;
  estimatedPayout: number;
  avgPrice: number;
}

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);

  constructor(
    @InjectModel(MarketLiquidity.name)
    private liquidityModel: Model<MarketLiquidityDocument>,
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    @InjectModel(OddsSnapshot.name)
    private snapshotModel: Model<OddsSnapshotDocument>,
  ) {}

  /**
   * Get or create liquidity for market
   */
  async getOrCreateLiquidity(marketId: string): Promise<MarketLiquidityDocument> {
    let liquidity = await this.liquidityModel.findOne({ marketId });

    if (!liquidity) {
      // Get prediction to initialize pools
      const prediction = await this.predictionModel.findById(marketId);
      if (!prediction) {
        throw new NotFoundException('Market not found');
      }

      // Initialize pools from outcomes
      const pools: OutcomePool[] = (prediction.outcomes || []).map(outcome => ({
        outcomeId: outcome.id,
        label: outcome.label,
        stake: 0,
        betsCount: 0,
      }));

      liquidity = await this.liquidityModel.create({
        marketId,
        feeBps: 300, // 3%
        pools,
        totalStake: 0,
        totalBets: 0,
        smoothingK: 50, // Smoothing factor
      });

      this.logger.log(`Created liquidity for market ${marketId}`);
    }

    return liquidity;
  }

  /**
   * Calculate dynamic odds for all outcomes
   * Formula: p_i = (pool_i + k) / (total + k * N), odds_i = 1 / p_i
   */
  async computeOdds(marketId: string): Promise<DynamicOdds[]> {
    const liquidity = await this.getOrCreateLiquidity(marketId);
    
    const { pools, totalStake, smoothingK } = liquidity;
    const N = pools.length;
    
    if (N === 0) return [];

    const denominator = totalStake + smoothingK * N;

    return pools.map(pool => {
      const numerator = pool.stake + smoothingK;
      const probability = numerator / denominator;
      const odds = Math.max(1.01, 1 / probability); // Min odds = 1.01

      return {
        outcomeId: pool.outcomeId,
        label: pool.label,
        pool: pool.stake,
        probability: Math.round(probability * 100 * 100) / 100, // percentage with 2 decimals
        odds: Math.round(odds * 100) / 100, // 2 decimal places
      };
    });
  }

  /**
   * Get odds for specific outcome
   */
  async getOutcomeOdds(marketId: string, outcomeId: string): Promise<number> {
    const allOdds = await this.computeOdds(marketId);
    const outcome = allOdds.find(o => o.outcomeId === outcomeId || o.label === outcomeId);
    return outcome?.odds || 2.0; // Default 2.0 if not found
  }

  /**
   * AMM Bet Preview - calculate dynamic odds and returns
   */
  async preview(marketId: string, outcomeId: string, stake: number): Promise<AMMPreview> {
    const liquidity = await this.getOrCreateLiquidity(marketId);
    
    // Calculate current odds
    const allOdds = await this.computeOdds(marketId);
    const outcomeOdds = allOdds.find(o => o.outcomeId === outcomeId || o.label === outcomeId);
    
    if (!outcomeOdds) {
      throw new NotFoundException('Outcome not found');
    }

    // Calculate fee
    const fee = (stake * liquidity.feeBps) / 10000;
    const netStake = stake - fee;
    
    // Potential return based on current odds
    const potentialReturn = stake * outcomeOdds.odds;
    
    // Estimated payout (parimutuel) - what user would get if market resolved now
    const currentPool = outcomeOdds.pool || 0;
    const totalAfterBet = liquidity.totalStake + netStake;
    const poolAfterBet = currentPool + netStake;
    const estimatedShare = netStake / poolAfterBet;
    const estimatedPayout = estimatedShare * totalAfterBet;
    
    // Average price = 1/odds
    const avgPrice = 1 / outcomeOdds.odds;

    return {
      stake,
      outcomeId,
      odds: outcomeOdds.odds,
      fee: Math.round(fee * 100) / 100,
      potentialReturn: Math.round(potentialReturn * 100) / 100,
      estimatedPayout: Math.round(estimatedPayout * 100) / 100,
      avgPrice: Math.round(avgPrice * 1000) / 1000,
    };
  }

  /**
   * Apply bet to liquidity pools
   */
  async applyBet(marketId: string, outcomeId: string, stake: number): Promise<MarketLiquidityDocument> {
    const liquidity = await this.getOrCreateLiquidity(marketId);
    
    // Find pool index
    const poolIndex = liquidity.pools.findIndex(
      p => p.outcomeId === outcomeId || p.label === outcomeId
    );
    
    if (poolIndex === -1) {
      throw new NotFoundException('Outcome pool not found');
    }

    // Calculate net stake (after fee)
    const fee = (stake * liquidity.feeBps) / 10000;
    const netStake = stake - fee;

    // Update pool
    liquidity.pools[poolIndex].stake += netStake;
    liquidity.pools[poolIndex].betsCount += 1;
    liquidity.totalStake += netStake;
    liquidity.totalBets += 1;

    await liquidity.save();

    // Record odds snapshot for chart
    this.recordSnapshot(marketId);

    this.logger.log(
      `Applied bet: market=${marketId}, outcome=${outcomeId}, stake=${stake}, net=${netStake}`
    );

    return liquidity;
  }

  /**
   * Calculate parimutuel payouts after resolution
   */
  async calculatePayouts(
    marketId: string,
    winningOutcomeId: string,
  ): Promise<{ totalPool: number; winnerPool: number; payoutMultiplier: number }> {
    const liquidity = await this.getOrCreateLiquidity(marketId);
    
    const winnerPool = liquidity.pools.find(
      p => p.outcomeId === winningOutcomeId || p.label === winningOutcomeId
    );
    
    if (!winnerPool) {
      throw new NotFoundException('Winning outcome not found');
    }

    // Total pool is sum of all stakes (fees already deducted during betting)
    const totalPool = liquidity.totalStake;
    const winnerPoolStake = winnerPool.stake;

    // Payout multiplier: totalPool / winnerPool
    const payoutMultiplier = winnerPoolStake > 0 
      ? totalPool / winnerPoolStake 
      : 1;

    return {
      totalPool,
      winnerPool: winnerPoolStake,
      payoutMultiplier: Math.round(payoutMultiplier * 100) / 100,
    };
  }

  /**
   * Get market liquidity summary
   */
  async getSummary(marketId: string): Promise<{
    totalStake: number;
    totalBets: number;
    pools: DynamicOdds[];
  }> {
    const liquidity = await this.getOrCreateLiquidity(marketId);
    const odds = await this.computeOdds(marketId);

    return {
      totalStake: liquidity.totalStake,
      totalBets: liquidity.totalBets,
      pools: odds,
    };
  }

  /**
   * Record odds snapshot after a bet
   */
  async recordSnapshot(marketId: string): Promise<void> {
    try {
      const odds = await this.computeOdds(marketId);
      const liquidity = await this.getOrCreateLiquidity(marketId);
      const now = new Date();
      
      const snapshots = odds.map(o => ({
        marketId,
        outcome: o.outcomeId,
        price: o.probability,
        volume: liquidity.totalStake,
        timestamp: now,
      }));
      
      await this.snapshotModel.insertMany(snapshots);
    } catch (err) {
      this.logger.warn(`Failed to record odds snapshot: ${err.message}`);
    }
  }

  /**
   * Get odds history for a market
   */
  async getOddsHistory(marketId: string, limit = 100): Promise<any[]> {
    return this.snapshotModel
      .find({ marketId }, { _id: 0, __v: 0 })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
