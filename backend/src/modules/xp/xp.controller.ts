import { Controller, Get, Param } from '@nestjs/common';
import { XpService } from './xp.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BADGES, XP_REWARDS } from './user-stats.schema';

@ApiTags('XP')
@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}
  
  @Get('stats/:wallet')
  @ApiOperation({ summary: 'Get user XP stats' })
  async getUserStats(@Param('wallet') wallet: string) {
    const data = await this.xpService.getUserStats(wallet);
    return { success: true, data };
  }
  
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get XP leaderboard' })
  async getLeaderboard() {
    const data = await this.xpService.getLeaderboard(50);
    return { success: true, data };
  }
  
  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  async getBadges() {
    return { 
      success: true, 
      data: Object.values(BADGES) 
    };
  }
  
  @Get('rewards')
  @ApiOperation({ summary: 'Get XP reward amounts' })
  async getRewards() {
    return { 
      success: true, 
      data: XP_REWARDS 
    };
  }
}
