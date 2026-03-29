import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './seasons.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller()
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  // ============================================
  // SEASONS ENDPOINTS
  // ============================================

  /**
   * Get all seasons
   * GET /api/seasons
   */
  @Get('seasons')
  async getAllSeasons() {
    const seasons = await this.seasonsService.getAllSeasons();
    return ApiResponse.success(seasons);
  }

  /**
   * Get current active season
   * GET /api/seasons/current
   */
  @Get('seasons/current')
  async getCurrentSeason() {
    const season = await this.seasonsService.getCurrentSeason();
    return ApiResponse.success(season);
  }

  /**
   * Get season snapshot for user
   * GET /api/seasons/current/snapshot/:wallet
   */
  @Get('seasons/current/snapshot/:wallet')
  async getSeasonSnapshot(@Param('wallet') wallet: string) {
    const snapshot = await this.seasonsService.getSeasonSnapshot(wallet);
    return ApiResponse.success(snapshot);
  }

  /**
   * Get season snapshot for authenticated user
   * GET /api/seasons/current/snapshot
   */
  @Get('seasons/current/my-snapshot')
  async getMySeasonSnapshot(@Headers('x-wallet-address') wallet: string) {
    const userWallet = wallet || '0xDefaultWallet';
    const snapshot = await this.seasonsService.getSeasonSnapshot(userWallet);
    return ApiResponse.success(snapshot);
  }

  /**
   * Create new season (admin)
   * POST /api/seasons
   */
  @Post('seasons')
  async createSeason(@Body() dto: CreateSeasonDto) {
    const season = await this.seasonsService.createSeason(dto);
    return ApiResponse.success(season, 'Season created');
  }

  /**
   * Get specific season
   * GET /api/seasons/:seasonId
   */
  @Get('seasons/:seasonId')
  async getSeasonById(@Param('seasonId') seasonId: string) {
    const season = await this.seasonsService.getSeasonById(seasonId);
    return ApiResponse.success(season);
  }

  // ============================================
  // LEADERBOARD ENDPOINTS
  // ============================================

  /**
   * Get profit leaderboard
   * GET /api/leaderboard/profit
   */
  @Get('leaderboard/profit')
  async getProfitLeaderboard(
    @Query('season') season?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.seasonsService.getProfitLeaderboard(
      season,
      limit ? parseInt(limit, 10) : 20,
    );
    return ApiResponse.success(data);
  }

  /**
   * Recalculate ranks (admin/cron)
   * POST /api/seasons/recalculate-ranks
   */
  @Post('seasons/recalculate-ranks')
  @HttpCode(HttpStatus.OK)
  async recalculateRanks(@Query('season') season?: string) {
    const count = await this.seasonsService.recalculateRanks(season);
    return ApiResponse.success({ recalculated: count }, `Recalculated ${count} ranks`);
  }
}
