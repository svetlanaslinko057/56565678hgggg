import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ResolutionService } from './resolution.service';
import { ResolutionWorker } from './resolution.worker';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ResolutionOutcome, OracleMetric } from '../predictions/predictions.schema';

class ResolveDto {
  @IsString()
  @IsNotEmpty()
  resolvedOutcomeId: string;
}

class CancelDto {
  reason: string;
}

class AdminResolveDto {
  @IsEnum(ResolutionOutcome)
  outcome: ResolutionOutcome;

  @IsString()
  @MinLength(10)
  reason: string;

  @IsOptional()
  @IsString()
  adminId?: string;
}

class DisputeDto {
  @IsString()
  @MinLength(20)
  reason: string;

  @IsOptional()
  @IsString()
  evidence?: string;
}

@Controller('markets')
export class ResolutionController {
  constructor(
    private readonly resolutionService: ResolutionService,
    private readonly resolutionWorker: ResolutionWorker,
  ) {}

  /**
   * Lock market - no more bets
   * POST /api/markets/:id/lock
   */
  @Post(':id/lock')
  async lockMarket(@Param('id') marketId: string) {
    const market = await this.resolutionService.lockMarket(marketId);
    return ApiResponse.success(market, 'Market locked');
  }

  /**
   * Resolve market - determine winner
   * POST /api/markets/:id/resolve
   */
  @Post(':id/resolve')
  async resolveMarket(
    @Param('id') marketId: string,
    @Body() dto: ResolveDto,
  ) {
    const result = await this.resolutionService.resolveMarket(
      marketId,
      dto.resolvedOutcomeId,
    );
    return ApiResponse.success(result, 'Market resolved');
  }

  /**
   * Cancel market - refund all
   * POST /api/markets/:id/cancel
   */
  @Post(':id/cancel')
  async cancelMarket(
    @Param('id') marketId: string,
    @Body() dto: CancelDto,
  ) {
    const result = await this.resolutionService.cancelMarket(
      marketId,
      dto.reason || 'Market canceled',
    );
    return ApiResponse.success(result, 'Market canceled, positions refunded');
  }

  // ==================== Oracle Resolution Engine V1 ====================

  /**
   * Run oracle check on a market
   * POST /api/markets/:id/oracle-check
   */
  @Post(':id/oracle-check')
  async runOracleCheck(@Param('id') marketId: string) {
    const result = await this.resolutionService.runOracleCheck(marketId);
    return ApiResponse.success(result, 'Oracle check completed');
  }

  /**
   * Admin resolve a market manually
   * POST /api/markets/:id/admin-resolve
   */
  @Post(':id/admin-resolve')
  async adminResolve(
    @Param('id') marketId: string,
    @Body() dto: AdminResolveDto,
  ) {
    const result = await this.resolutionService.adminResolveMarket(marketId, dto);
    return ApiResponse.success(result, 'Market resolved by admin');
  }

  /**
   * Dispute a market resolution
   * POST /api/markets/:id/dispute
   */
  @Post(':id/dispute')
  async disputeMarket(
    @Param('id') marketId: string,
    @Body() dto: DisputeDto,
  ) {
    const result = await this.resolutionService.disputeMarket(marketId, dto.reason);
    return ApiResponse.success(result, 'Market disputed');
  }

  /**
   * Get current oracle value for an asset
   * GET /api/markets/oracle/price?asset=bitcoin&metric=price
   */
  @Get('oracle/price')
  async getOraclePrice(
    @Query('asset') asset: string,
    @Query('metric') metric: string = 'price',
  ) {
    const result = await this.resolutionService.getCurrentOracleValue(
      asset,
      metric as OracleMetric
    );
    return ApiResponse.success(result, 'Oracle price fetched');
  }

  /**
   * Get resolution statistics
   * GET /api/markets/resolution/stats
   */
  @Get('resolution/stats')
  async getResolutionStats() {
    const stats = await this.resolutionService.getResolutionStats();
    return ApiResponse.success(stats, 'Resolution stats');
  }

  /**
   * Trigger resolution worker manually (admin only)
   * POST /api/markets/resolution/trigger
   */
  @Post('resolution/trigger')
  async triggerResolution() {
    const result = await this.resolutionWorker.triggerResolution();
    return ApiResponse.success(result, 'Resolution triggered');
  }
}
