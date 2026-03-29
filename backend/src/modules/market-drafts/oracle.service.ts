import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OracleResult {
  source: string;
  asset: string;
  value: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface OracleCondition {
  source: string;
  asset: string;
  operator: string;
  value: number;
}

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);
  private readonly priceCache = new Map<string, { price: number; timestamp: Date }>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  constructor(private configService: ConfigService) {}

  /**
   * Fetch price from CoinGecko
   */
  async fetchCoinGeckoPrice(asset: string): Promise<OracleResult> {
    const cacheKey = `coingecko:${asset.toLowerCase()}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
      return {
        source: 'coingecko',
        asset,
        value: cached.price,
        timestamp: cached.timestamp,
        success: true,
      };
    }

    try {
      // Map common symbols to CoinGecko IDs
      const assetMap: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        BNB: 'binancecoin',
        XRP: 'ripple',
        ADA: 'cardano',
        DOGE: 'dogecoin',
        AVAX: 'avalanche-2',
        DOT: 'polkadot',
        LINK: 'chainlink',
        MATIC: 'matic-network',
        USDT: 'tether',
        USDC: 'usd-coin',
      };

      const coinId = assetMap[asset.toUpperCase()] || asset.toLowerCase();
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { timeout: 10000 }
      );

      const price = response.data[coinId]?.usd;
      if (price === undefined) {
        throw new Error(`Price not found for ${asset}`);
      }

      // Cache result
      this.priceCache.set(cacheKey, { price, timestamp: new Date() });

      return {
        source: 'coingecko',
        asset,
        value: price,
        timestamp: new Date(),
        success: true,
      };
    } catch (error: any) {
      this.logger.error(`CoinGecko fetch failed for ${asset}: ${error.message}`);
      return {
        source: 'coingecko',
        asset,
        value: 0,
        timestamp: new Date(),
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch price from multiple sources and return average
   */
  async fetchPrice(asset: string): Promise<OracleResult> {
    // Primary: CoinGecko
    const cgResult = await this.fetchCoinGeckoPrice(asset);
    if (cgResult.success) {
      return cgResult;
    }

    // Fallback: could add more sources here
    return cgResult;
  }

  /**
   * Evaluate oracle condition
   */
  async evaluateCondition(condition: OracleCondition): Promise<{
    result: boolean;
    actualValue: number;
    targetValue: number;
    operator: string;
    success: boolean;
    error?: string;
  }> {
    const oracleResult = await this.fetchPrice(condition.asset);

    if (!oracleResult.success) {
      return {
        result: false,
        actualValue: 0,
        targetValue: condition.value,
        operator: condition.operator,
        success: false,
        error: oracleResult.error,
      };
    }

    const actualValue = oracleResult.value;
    const targetValue = condition.value;
    let result = false;

    switch (condition.operator) {
      case '>':
        result = actualValue > targetValue;
        break;
      case '<':
        result = actualValue < targetValue;
        break;
      case '>=':
        result = actualValue >= targetValue;
        break;
      case '<=':
        result = actualValue <= targetValue;
        break;
      case '=':
      case '==':
        result = Math.abs(actualValue - targetValue) < 0.01; // 1 cent tolerance
        break;
      default:
        return {
          result: false,
          actualValue,
          targetValue,
          operator: condition.operator,
          success: false,
          error: `Unknown operator: ${condition.operator}`,
        };
    }

    this.logger.log(
      `Oracle evaluated: ${condition.asset} ${condition.operator} ${targetValue} → ${actualValue} = ${result}`
    );

    return {
      result,
      actualValue,
      targetValue,
      operator: condition.operator,
      success: true,
    };
  }

  /**
   * Get suggested outcome based on oracle
   */
  async getSuggestedOutcome(condition: OracleCondition): Promise<{
    suggestedOutcome: string;
    confidence: string;
    actualValue: number;
    targetValue: number;
    success: boolean;
    error?: string;
  }> {
    const evaluation = await this.evaluateCondition(condition);

    if (!evaluation.success) {
      return {
        suggestedOutcome: 'UNKNOWN',
        confidence: 'LOW',
        actualValue: 0,
        targetValue: condition.value,
        success: false,
        error: evaluation.error,
      };
    }

    // Calculate confidence based on distance from threshold
    const percentDiff = Math.abs(
      (evaluation.actualValue - evaluation.targetValue) / evaluation.targetValue
    ) * 100;

    let confidence = 'MEDIUM';
    if (percentDiff > 10) confidence = 'HIGH';
    if (percentDiff < 2) confidence = 'LOW';

    return {
      suggestedOutcome: evaluation.result ? 'yes' : 'no',
      confidence,
      actualValue: evaluation.actualValue,
      targetValue: evaluation.targetValue,
      success: true,
    };
  }

  /**
   * Get multiple prices at once
   */
  async getMultiplePrices(assets: string[]): Promise<Map<string, OracleResult>> {
    const results = new Map<string, OracleResult>();

    await Promise.all(
      assets.map(async (asset) => {
        const result = await this.fetchPrice(asset);
        results.set(asset.toUpperCase(), result);
      })
    );

    return results;
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
    this.logger.log('Oracle price cache cleared');
  }

  /**
   * Scheduled cache refresh
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshPopularPrices() {
    const popular = ['BTC', 'ETH', 'SOL', 'BNB'];
    for (const asset of popular) {
      await this.fetchPrice(asset);
    }
    this.logger.debug('Popular prices refreshed');
  }
}
