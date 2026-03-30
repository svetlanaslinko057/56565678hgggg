import { Controller, Get, Param, Query } from '@nestjs/common';
import { EconomyService } from './economy.service';

@Controller('economy')
export class EconomyController {
  constructor(private economyService: EconomyService) {}

  /**
   * Get economy-based leaderboard (real positions + XP)
   */
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const leaderboard = await this.economyService.getLeaderboard(
      limit ? parseInt(limit) : 20
    );
    
    return {
      success: true,
      data: leaderboard,
    };
  }

  /**
   * Get user economy stats (real positions + XP)
   */
  @Get('stats/:wallet')
  async getUserStats(@Param('wallet') wallet: string) {
    const stats = await this.economyService.getUserEconomyStats(wallet);
    
    return {
      success: true,
      data: stats,
    };
  }
}
