import {
  Controller,
  Get,
  Query,
  Headers,
} from '@nestjs/common';
import { SeasonsService } from '../seasons/seasons.service';
import { LeaderboardService } from './leaderboard.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('analysts/leaderboard')
export class AnalystsLeaderboardController {
  constructor(private readonly seasonsService: SeasonsService) {}

  /**
   * Get season leaderboard (legacy)
   * GET /api/analysts/leaderboard
   */
  @Get()
  async getLeaderboard(
    @Query('season') season?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const result = await this.seasonsService.getLeaderboard(
      season,
      sortBy || 'leaguePoints',
      limit ? parseInt(limit, 10) : 20,
      cursor,
    );
    return ApiResponse.success(result);
  }
}

/**
 * Main Leaderboard Controller
 * Supports Global, Weekly, Profit, Duels, XP rankings
 */
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * Get leaderboard
   * GET /api/leaderboard
   * 
   * Query params:
   * - type: 'global' | 'weekly' | 'profit' | 'duels' | 'xp'
   * - limit: number (default 20)
   */
  @Get()
  async getLeaderboard(
    @Query('type') type?: 'global' | 'weekly' | 'profit' | 'duels' | 'xp',
    @Query('limit') limit?: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const result = await this.leaderboardService.getLeaderboard(
      type || 'global',
      limit ? parseInt(limit, 10) : 20,
      walletAddress,
    );
    return ApiResponse.success(result);
  }

  /**
   * Get global leaderboard (all time profit)
   * GET /api/leaderboard/global
   */
  @Get('global')
  async getGlobalLeaderboard(
    @Query('limit') limit?: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const result = await this.leaderboardService.getLeaderboard(
      'global',
      limit ? parseInt(limit, 10) : 20,
      walletAddress,
    );
    return ApiResponse.success(result);
  }

  /**
   * Get weekly leaderboard (last 7 days)
   * GET /api/leaderboard/weekly
   */
  @Get('weekly')
  async getWeeklyLeaderboard(
    @Query('limit') limit?: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const result = await this.leaderboardService.getLeaderboard(
      'weekly',
      limit ? parseInt(limit, 10) : 20,
      walletAddress,
    );
    return ApiResponse.success(result);
  }

  /**
   * Get duels leaderboard
   * GET /api/leaderboard/duels
   */
  @Get('duels')
  async getDuelsLeaderboard(
    @Query('limit') limit?: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const result = await this.leaderboardService.getLeaderboard(
      'duels',
      limit ? parseInt(limit, 10) : 20,
      walletAddress,
    );
    return ApiResponse.success(result);
  }

  /**
   * Get XP leaderboard
   * GET /api/leaderboard/xp
   */
  @Get('xp')
  async getXpLeaderboard(
    @Query('limit') limit?: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const result = await this.leaderboardService.getLeaderboard(
      'xp',
      limit ? parseInt(limit, 10) : 20,
      walletAddress,
    );
    return ApiResponse.success(result);
  }
}
