import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { IndexerService } from '../indexer/indexer.service';
import { PredictionsService } from '../predictions/predictions.service';
import { LiquidityService } from '../liquidity/liquidity.service';
import { MarketsService } from './markets.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('markets')
export class MarketsController {
  private readonly PLATFORM_FEE_BPS = 300; // 3% platform fee

  constructor(
    private readonly indexerService: IndexerService,
    private readonly predictionsService: PredictionsService,
    private readonly liquidityService: LiquidityService,
    private readonly marketsService: MarketsService,
  ) {}

  /**
   * BLOCK 4: Get full market details
   * GET /api/markets/:id
   */
  @Get(':id')
  async getMarketDetails(@Param('id') marketId: string) {
    const details = await this.marketsService.getMarketDetails(marketId);
    return ApiResponse.success(details);
  }

  /**
   * BLOCK 3: Get odds history for charting
   * GET /api/markets/:id/odds-history
   */
  @Get(':id/odds-history')
  async getOddsHistory(
    @Param('id') marketId: string,
    @Query('outcomeId') outcomeId?: string,
    @Query('period') period?: '1H' | '24H' | '7D' | '30D' | 'ALL',
    @Query('limit') limit?: number,
  ) {
    const history = await this.marketsService.getOddsHistory({
      marketId,
      outcomeId,
      period: period || '30D',
      limit: limit || 100,
    });
    return ApiResponse.success(history);
  }

  /**
   * Get market liquidity summary
   * Returns current pools and dynamic odds
   */
  @Get(':id/liquidity')
  async getLiquidity(@Param('id') marketId: string) {
    const summary = await this.liquidityService.getSummary(marketId);
    return ApiResponse.success(summary);
  }

  /**
   * Get dynamic odds for all outcomes
   */
  @Get(':id/odds')
  async getOdds(@Param('id') marketId: string) {
    const odds = await this.liquidityService.computeOdds(marketId);
    return ApiResponse.success(odds);
  }

  /**
   * AI sentiment endpoint
   * Returns mock AI analysis data for the market
   */
  @Get(':id/ai')
  async getAISentiment(@Param('id') marketId: string) {
    // Try to get prediction details
    let momentum = 0.62;
    let signal = 'bullish';
    
    try {
      const prediction = await this.predictionsService.findByMarketId(marketId);
      
      if (prediction) {
        // Calculate momentum based on risk level
        if (prediction.riskLevel === 'high') {
          momentum = 0.75;
          signal = 'bullish';
        } else if (prediction.riskLevel === 'low') {
          momentum = 0.45;
          signal = 'neutral';
        }
      }
    } catch (error) {
      // Use defaults if prediction not found
    }
    
    // Get market stats to calculate attention index
    let attentionIndex = 50;
    try {
      const stats = await this.indexerService.getMarketStats(marketId);
      if (stats) {
        // Base attention on participant count
        attentionIndex = Math.min(100, (stats.participantsCount || 0) * 10 + 50);
      }
    } catch (error) {
      // Use default
    }
    
    return ApiResponse.success({
      momentum,
      attentionIndex,
      consensus: momentum > 0.6 ? 'bullish' : momentum < 0.4 ? 'bearish' : 'moderate',
      volatility: momentum > 0.7 ? 'high' : momentum < 0.3 ? 'low' : 'medium',
      narrative: momentum > 0.5 ? 'expanding' : 'contracting',
      signal,
    });
  }

  /**
   * Get live bets for a market
   */
  @Get(':id/live-bets')
  async getLiveBets(
    @Param('id') marketId: string,
    @Query('limit') limit?: number,
  ) {
    const bets = await this.indexerService.getLiveBets(marketId, limit || 20);
    return ApiResponse.success(bets);
  }

  /**
   * Get market stats
   */
  @Get(':id/stats')
  async getMarketStats(@Param('id') marketId: string) {
    const stats = await this.indexerService.getMarketStats(marketId);
    
    // Also get liquidity data
    try {
      const liquidity = await this.liquidityService.getSummary(marketId);
      return ApiResponse.success({
        ...(stats || {}),
        totalVolume: liquidity.totalStake.toString(),
        totalBets: liquidity.totalBets,
        pools: liquidity.pools,
      });
    } catch {
      return ApiResponse.success(stats || {
        totalVolume: '0',
        totalBets: 0,
        participantsCount: 0,
        outcomePools: {},
      });
    }
  }

  /**
   * Get all positions for a market
   */
  @Get(':id/positions')
  async getMarketPositions(@Param('id') marketId: string) {
    const positions = await this.indexerService.getMarketPositions(marketId);
    return ApiResponse.success(positions);
  }
}
