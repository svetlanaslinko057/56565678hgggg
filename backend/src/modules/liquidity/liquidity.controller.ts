import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  /**
   * Get dynamic odds for market
   * GET /api/liquidity/:marketId/odds
   */
  @Get(':marketId/odds')
  async getOdds(@Param('marketId') marketId: string) {
    const odds = await this.liquidityService.computeOdds(marketId);
    return ApiResponse.success(odds);
  }

  /**
   * Get liquidity summary
   * GET /api/liquidity/:marketId/summary
   */
  @Get(':marketId/summary')
  async getSummary(@Param('marketId') marketId: string) {
    const summary = await this.liquidityService.getSummary(marketId);
    return ApiResponse.success(summary);
  }

  /**
   * Get odds history for chart
   * GET /api/liquidity/:marketId/odds-history
   */
  @Get(':marketId/odds-history')
  async getOddsHistory(
    @Param('marketId') marketId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.liquidityService.getOddsHistory(marketId, parseInt(limit || '100'));
    return ApiResponse.success(data);
  }
}
