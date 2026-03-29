import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prediction, PredictionDocument, PredictionStatus, OracleMethod } from '../predictions/predictions.schema';
import { ResolutionService } from '../resolution/resolution.service';
import { DuelsService } from '../duels/duels.service';
import axios from 'axios';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    private resolutionService: ResolutionService,
    private duelsService: DuelsService,
  ) {}

  /**
   * Check markets ready for resolution every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkMarketsToResolve(): Promise<void> {
    this.logger.log('🔍 Checking markets ready for resolution...');

    try {
      // Find markets that should be resolved
      const marketsToCheck = await this.predictionModel.find({
        status: { $in: [PredictionStatus.PUBLISHED, PredictionStatus.LOCKED] },
        closeTime: { $lte: new Date() },
        oracleConfig: { $exists: true },
      });

      this.logger.log(`Found ${marketsToCheck.length} markets to check`);

      for (const market of marketsToCheck) {
        try {
          await this.processMarketOracle(market);
        } catch (error) {
          this.logger.error(`Failed to process market ${market._id}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Oracle cron failed: ${error.message}`);
    }
  }

  /**
   * Process oracle for a market
   */
  async processMarketOracle(market: PredictionDocument): Promise<void> {
    const { oracleConfig } = market;

    if (!oracleConfig || oracleConfig.method === OracleMethod.MANUAL) {
      // Skip manual markets
      return;
    }

    // Lock market first if not locked
    if (market.status === PredictionStatus.PUBLISHED) {
      await this.resolutionService.lockMarket(market._id.toString());
      market.status = PredictionStatus.LOCKED;
    }

    let result: boolean | null = null;

    // Check oracle based on method
    switch (oracleConfig.method) {
      case OracleMethod.PRICE_FEED:
        result = await this.checkPriceFeed(market);
        break;
      case OracleMethod.COMMUNITY_VOTE:
        // Community vote handled separately
        return;
      default:
        this.logger.warn(`Unknown oracle method: ${oracleConfig.method}`);
        return;
    }

    // If we have a result, resolve the market
    if (result !== null) {
      const winningOutcome = result ? 'yes' : 'no';
      
      await this.resolutionService.resolveMarket(
        market._id.toString(),
        winningOutcome,
      );

      // Resolve related duels
      await this.resolveDuelsForMarket(market._id.toString(), winningOutcome);

      this.logger.log(`✅ Market ${market._id} resolved via oracle: ${winningOutcome}`);
    }
  }

  /**
   * Check price feed oracle
   */
  async checkPriceFeed(market: PredictionDocument): Promise<boolean | null> {
    const { oracleConfig } = market;
    
    if (!oracleConfig?.asset || !oracleConfig?.targetValue) {
      this.logger.warn(`Invalid oracle config for market ${market._id}`);
      return null;
    }

    try {
      // Get current price from CoinGecko
      const coinMap: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        BNB: 'binancecoin',
      };

      const coinId = coinMap[oracleConfig.asset.toUpperCase()];
      if (!coinId) {
        this.logger.warn(`Unknown asset: ${oracleConfig.asset}`);
        return null;
      }

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { timeout: 10000 },
      );

      const currentPrice = response.data[coinId]?.usd;
      if (!currentPrice) {
        this.logger.warn(`Could not get price for ${coinId}`);
        return null;
      }

      this.logger.log(`Price check: ${oracleConfig.asset} = $${currentPrice}, target: ${oracleConfig.operator} $${oracleConfig.targetValue}`);

      // Compare with target
      switch (oracleConfig.operator) {
        case 'gt':
          return currentPrice > oracleConfig.targetValue;
        case 'gte':
          return currentPrice >= oracleConfig.targetValue;
        case 'lt':
          return currentPrice < oracleConfig.targetValue;
        case 'lte':
          return currentPrice <= oracleConfig.targetValue;
        case 'eq':
          return Math.abs(currentPrice - oracleConfig.targetValue) < 0.01;
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Price feed check failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Resolve all duels for a market
   */
  async resolveDuelsForMarket(marketId: string, winningOutcome: string): Promise<void> {
    try {
      await this.duelsService.resolveByMarket(marketId, winningOutcome);
      this.logger.log(`Resolved duels for market ${marketId}`);
    } catch (error) {
      this.logger.error(`Failed to resolve duels for market ${marketId}: ${error.message}`);
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerOracleCheck(): Promise<{ checked: number; resolved: number }> {
    let checked = 0;
    let resolved = 0;

    const marketsToCheck = await this.predictionModel.find({
      status: { $in: [PredictionStatus.PUBLISHED, PredictionStatus.LOCKED] },
      closeTime: { $lte: new Date() },
    });

    for (const market of marketsToCheck) {
      checked++;
      try {
        await this.processMarketOracle(market);
        resolved++;
      } catch (error) {
        this.logger.error(`Failed to process: ${error.message}`);
      }
    }

    return { checked, resolved };
  }
}
