/**
 * Oracle Engine - Auto-resolves markets based on external data
 */

import { Injectable, Logger } from '@nestjs/common';
import { CoingeckoProvider } from '../providers/coingecko.provider';
import { compareValue, CompareOperator, formatOutcomeExplanation } from '../utils/compare';
import { 
  PredictionDocument, 
  OracleMetric, 
  OracleOperator, 
  ResolutionOutcome 
} from '../../predictions/predictions.schema';

export interface OracleResult {
  success: boolean;
  outcome?: ResolutionOutcome;
  reason?: string;
  payload?: {
    metric: string;
    asset: string;
    operator: string;
    targetValue: number;
    actualValue: number;
    source: string;
    checkedAt: string;
    conditionMet: boolean;
  };
}

@Injectable()
export class OracleEngine {
  private readonly logger = new Logger(OracleEngine.name);

  constructor(private readonly coingecko: CoingeckoProvider) {}

  async resolve(market: PredictionDocument): Promise<OracleResult> {
    const cfg = market.resolution;
    
    if (!cfg) {
      return {
        success: false,
        reason: 'No resolution config found',
      };
    }

    if (cfg.mode !== 'oracle') {
      return {
        success: false,
        reason: 'Market is not configured for oracle resolution',
      };
    }

    // Validate oracle config
    if (!cfg.metric || !cfg.asset || !cfg.operator || typeof cfg.targetValue !== 'number') {
      return {
        success: false,
        reason: `Incomplete oracle config: metric=${cfg.metric}, asset=${cfg.asset}, operator=${cfg.operator}, target=${cfg.targetValue}`,
      };
    }

    // Check if evaluation time has passed
    const evaluationTime = cfg.evaluationTime || market.closeTime;
    if (new Date() < new Date(evaluationTime)) {
      return {
        success: false,
        reason: `Evaluation time not reached yet: ${evaluationTime}`,
      };
    }

    // Fetch actual value from oracle
    const metricType = this.mapMetric(cfg.metric);
    const actualValue = await this.coingecko.getMetricValue(cfg.asset, metricType);

    if (actualValue === null) {
      return {
        success: false,
        reason: `Oracle provider returned no data for ${cfg.asset} ${cfg.metric}`,
      };
    }

    // Evaluate condition
    const operator = cfg.operator as CompareOperator;
    const conditionMet = compareValue(actualValue, operator, cfg.targetValue);
    const outcome = conditionMet ? ResolutionOutcome.YES : ResolutionOutcome.NO;

    this.logger.log(
      `Oracle resolved: ${cfg.asset} ${cfg.metric} = ${actualValue} ${operator} ${cfg.targetValue} → ${outcome}`
    );

    return {
      success: true,
      outcome,
      reason: formatOutcomeExplanation(
        conditionMet,
        cfg.asset,
        operator,
        cfg.targetValue,
        actualValue
      ),
      payload: {
        metric: cfg.metric,
        asset: cfg.asset,
        operator: cfg.operator,
        targetValue: cfg.targetValue,
        actualValue,
        source: cfg.source || 'coingecko',
        checkedAt: new Date().toISOString(),
        conditionMet,
      },
    };
  }

  private mapMetric(metric: OracleMetric): 'price' | 'fdv' | 'market_cap' | 'volume_24h' {
    switch (metric) {
      case OracleMetric.PRICE:
        return 'price';
      case OracleMetric.FDV:
        return 'fdv';
      case OracleMetric.MARKET_CAP:
        return 'market_cap';
      case OracleMetric.VOLUME_24H:
        return 'volume_24h';
      default:
        return 'price';
    }
  }

  async checkCurrentValue(asset: string, metric: OracleMetric): Promise<{
    value: number | null;
    source: string;
    timestamp: string;
  }> {
    const metricType = this.mapMetric(metric);
    const value = await this.coingecko.getMetricValue(asset, metricType);
    
    return {
      value,
      source: 'coingecko',
      timestamp: new Date().toISOString(),
    };
  }
}
