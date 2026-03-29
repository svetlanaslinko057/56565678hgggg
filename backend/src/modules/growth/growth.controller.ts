import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GrowthService } from './growth.service';

const extractWallet = (req: any): string => {
  return req.headers['x-wallet-address'] || req.body?.wallet || '0xanonymous';
};

@ApiTags('Growth')
@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  // ==================== Streaks ====================

  @Get('streak/:wallet')
  @ApiOperation({ summary: 'Get user streak' })
  async getStreak(@Param('wallet') wallet: string) {
    const data = await this.growthService.getOrCreateStreak(wallet);
    return { success: true, data };
  }

  @Get('streaks/leaderboard')
  @ApiOperation({ summary: 'Get streak leaderboard' })
  async getStreakLeaderboard(@Query('limit') limit?: string) {
    const data = await this.growthService.getStreakLeaderboard(parseInt(limit || '20'));
    return { success: true, data };
  }

  // ==================== Analyst Profiles ====================

  @Get('analyst/:wallet')
  @ApiOperation({ summary: 'Get analyst profile' })
  async getAnalystProfile(@Param('wallet') wallet: string) {
    const data = await this.growthService.getAnalystProfile(wallet);
    return { success: true, data };
  }

  @Get('analysts/top')
  @ApiOperation({ summary: 'Get top analysts' })
  async getTopAnalysts(
    @Query('sortBy') sortBy?: 'roi' | 'accuracy' | 'followers' | 'volume',
    @Query('limit') limit?: string,
  ) {
    const data = await this.growthService.getTopAnalysts(sortBy || 'roi', parseInt(limit || '20'));
    return { success: true, data };
  }

  @Post('analyst/:wallet/follow')
  @ApiOperation({ summary: 'Follow an analyst' })
  async followAnalyst(@Param('wallet') targetWallet: string, @Req() req: any) {
    const followerWallet = extractWallet(req);
    await this.growthService.followAnalyst(followerWallet, targetWallet);
    return { success: true, message: 'Followed successfully' };
  }

  @Post('analyst/:wallet/unfollow')
  @ApiOperation({ summary: 'Unfollow an analyst' })
  async unfollowAnalyst(@Param('wallet') targetWallet: string, @Req() req: any) {
    const followerWallet = extractWallet(req);
    await this.growthService.unfollowAnalyst(followerWallet, targetWallet);
    return { success: true, message: 'Unfollowed successfully' };
  }

  // ==================== Share ====================

  @Get('share/position/:positionId')
  @ApiOperation({ summary: 'Generate share card for position' })
  async generateShareCard(@Param('positionId') positionId: string, @Req() req: any) {
    const wallet = extractWallet(req);
    const data = await this.growthService.generateShareCard(wallet, positionId);
    return { success: true, data };
  }
}
