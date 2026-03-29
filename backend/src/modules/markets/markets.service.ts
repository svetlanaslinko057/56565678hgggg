import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OddsSnapshot, OddsSnapshotDocument } from './odds-snapshot.schema';
import { LiquidityService } from '../liquidity/liquidity.service';
import { PredictionsService } from '../predictions/predictions.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface MarketDetailsResponse {
  id: string;
  title: string;
  description: string;
  outcomes: Array<{
    id: string;
    label: string;
    probability: number;
    odds: number;
  }>;
  volume: number;
  liquidity: number;
  closeTime: string;
  status: string;
  category: string;
  riskLevel: string;
  totalBets: number;
  participantsCount: number;
}

export interface OddsHistoryParams {
  marketId: string;
  outcomeId?: string;
  period?: '1H' | '24H' | '7D' | '30D' | 'ALL';
  limit?: number;
}

/**
 * BLOCK 3 & 4: Markets Service
 * Handles market details and odds history
 */
@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    @InjectModel(OddsSnapshot.name)
    private oddsSnapshotModel: Model<OddsSnapshotDocument>,
    private predictionsService: PredictionsService,
    private liquidityService: LiquidityService,
  ) {}

  /**
   * BLOCK 4: Get full market details
   * GET /api/markets/:id
   */
  async getMarketDetails(marketId: string): Promise<MarketDetailsResponse> {
    const prediction = await this.predictionsService.findById(marketId);
    
    if (!prediction) {
      throw new NotFoundException('Market not found');
    }

    // Get liquidity data
    let liquidityData;
    try {
      liquidityData = await this.liquidityService.getSummary(marketId);
    } catch {
      liquidityData = { totalStake: 0, totalBets: 0, pools: [] };
    }

    // Compute current odds for each outcome
    let oddsData;
    try {
      oddsData = await this.liquidityService.computeOdds(marketId);
    } catch {
      oddsData = {};
    }

    const outcomes = (prediction.outcomes || []).map((o: any) => ({
      id: o.id,
      label: o.label,
      probability: o.probability || 50,
      odds: oddsData[o.id]?.odds || o.yesMultiplier || 2.0,
    }));

    return {
      id: (prediction as any)._id.toString(),
      title: prediction.question,
      description: prediction.description || '',
      outcomes,
      volume: prediction.totalVolume || liquidityData.totalStake || 0,
      liquidity: liquidityData.totalStake || 0,
      closeTime: prediction.closeTime?.toISOString() || '',
      status: prediction.status,
      category: prediction.category || '',
      riskLevel: prediction.riskLevel || 'medium',
      totalBets: liquidityData.totalBets || prediction.totalBets || 0,
      participantsCount: 0, // Could be calculated from positions
    };
  }

  /**
   * BLOCK 3: Get odds history for charting
   * GET /api/markets/:id/odds-history
   */
  async getOddsHistory(params: OddsHistoryParams): Promise<OddsSnapshot[]> {
    const { marketId, outcomeId, period = '30D', limit = 100 } = params;

    // Calculate time range
    const now = new Date();
    let startTime: Date;

    switch (period) {
      case '1H':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24H':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7D':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30D':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ALL':
      default:
        startTime = new Date(0);
    }

    const query: any = {
      marketId,
      timestamp: { $gte: startTime },
    };

    if (outcomeId) {
      query.outcomeId = outcomeId;
    }

    const snapshots = await this.oddsSnapshotModel
      .find(query)
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean()
      .exec();

    // If no historical data, generate synthetic data points
    if (snapshots.length === 0) {
      return this.generateSyntheticHistory(marketId, period, limit);
    }

    return snapshots as OddsSnapshot[];
  }

  /**
   * Record odds snapshot (called after each bet)
   */
  async recordOddsSnapshot(marketId: string): Promise<void> {
    try {
      const prediction = await this.predictionsService.findById(marketId);
      const oddsData = await this.liquidityService.computeOdds(marketId);
      const liquidityData = await this.liquidityService.getSummary(marketId);

      const snapshots = (prediction.outcomes || []).map((o: any) => ({
        marketId,
        outcomeId: o.id,
        outcomeLabel: o.label,
        price: oddsData[o.id]?.probability || 0.5,
        odds: oddsData[o.id]?.odds || 2.0,
        timestamp: new Date(),
        totalStake: liquidityData.totalStake || 0,
      }));

      await this.oddsSnapshotModel.insertMany(snapshots);
      this.logger.debug(`Recorded odds snapshot for market ${marketId}`);
    } catch (error) {
      this.logger.warn(`Failed to record odds snapshot: ${error.message}`);
    }
  }

  /**
   * Generate synthetic history for markets without data
   */
  private async generateSyntheticHistory(
    marketId: string,
    period: string,
    limit: number,
  ): Promise<OddsSnapshot[]> {
    try {
      const prediction = await this.predictionsService.findById(marketId);
      const outcomes = prediction.outcomes || [];
      
      if (outcomes.length === 0) return [];

      const now = new Date();
      const dataPoints = Math.min(limit, period === '24H' ? 24 : period === '7D' ? 84 : 60);
      const intervalMs = period === '24H' 
        ? 60 * 60 * 1000 
        : period === '7D' 
          ? 2 * 60 * 60 * 1000 
          : 12 * 60 * 60 * 1000;

      const result: OddsSnapshot[] = [];

      for (let i = dataPoints; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);
        
        for (const outcome of outcomes) {
          // Generate smooth random walk for odds
          const baseProb = outcome.probability || 50;
          const variation = (Math.random() - 0.5) * 20;
          const prob = Math.max(5, Math.min(95, baseProb + variation - i * 0.1));
          
          result.push({
            marketId,
            outcomeId: outcome.id,
            outcomeLabel: outcome.label,
            price: prob / 100,
            odds: 1 / (prob / 100),
            timestamp,
            totalStake: 0,
            volume24h: 0,
          } as OddsSnapshot);
        }
      }

      return result;
    } catch {
      return [];
    }
  }

  /**
   * Cron job: Take hourly snapshots for active markets
   */
  // @Cron(CronExpression.EVERY_HOUR)
  async takeHourlySnapshots(): Promise<void> {
    try {
      const { data: activeMarkets } = await this.predictionsService.findAll(
        { status: 'published' as any },
        1,
        100,
      );

      for (const market of activeMarkets) {
        await this.recordOddsSnapshot((market as any)._id.toString());
      }

      this.logger.log(`Hourly odds snapshots recorded for ${activeMarkets.length} markets`);
    } catch (error) {
      this.logger.error(`Failed to take hourly snapshots: ${error.message}`);
    }
  }
}
