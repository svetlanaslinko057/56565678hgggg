import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GrowthLoopService } from './growth-loop.service';

@ApiTags('Growth Loop')
@Controller('growth')
export class GrowthLoopController {
  constructor(private readonly growthService: GrowthLoopService) {}

  @Get('weekly/:wallet')
  @ApiOperation({ summary: 'Get weekly competition data for user' })
  @ApiParam({ name: 'wallet', description: 'User wallet address' })
  async getWeeklyCompetition(@Param('wallet') wallet: string) {
    const data = await this.growthService.getWeeklyCompetition(wallet);
    return { success: true, data };
  }

  @Get('rivals/:wallet')
  @ApiOperation({ summary: 'Get rival pressure data' })
  @ApiParam({ name: 'wallet', description: 'User wallet address' })
  async getRivalPressure(@Param('wallet') wallet: string) {
    const data = await this.growthService.getRivalPressure(wallet);
    return { success: true, data };
  }

  @Get('deeplink')
  @ApiOperation({ summary: 'Generate Telegram deep link' })
  @ApiQuery({ name: 'type', enum: ['market', 'rival', 'win', 'leaderboard', 'referral'] })
  @ApiQuery({ name: 'marketId', required: false })
  @ApiQuery({ name: 'rivalWallet', required: false })
  @ApiQuery({ name: 'shareId', required: false })
  @ApiQuery({ name: 'refWallet', required: false })
  generateDeepLink(
    @Query('type') type: 'market' | 'rival' | 'win' | 'leaderboard' | 'referral',
    @Query('marketId') marketId?: string,
    @Query('rivalWallet') rivalWallet?: string,
    @Query('shareId') shareId?: string,
    @Query('refWallet') refWallet?: string,
  ) {
    const deepLink = this.growthService.generateTelegramDeepLink({
      type,
      marketId,
      rivalWallet,
      shareId,
      refWallet,
    });
    return { success: true, data: { deepLink } };
  }

  @Post('win-card')
  @ApiOperation({ summary: 'Generate enhanced win card data' })
  async generateWinCard(
    @Body() body: {
      wallet: string;
      positionId: string;
      profit: number;
      stake: number;
    },
  ) {
    const data = await this.growthService.generateWinCardData(body);
    return { success: true, data };
  }

  @Post('notify/rival-pressure')
  @ApiOperation({ summary: 'Send rival pressure notification' })
  async sendRivalPressure(
    @Body() body: {
      wallet: string;
      rivalWallet: string;
      rivalName: string;
      yourWins: number;
      rivalWins: number;
      streak: number;
    },
  ) {
    await this.growthService.sendRivalPressureNotification(body.wallet, {
      rivalWallet: body.rivalWallet,
      rivalName: body.rivalName,
      yourWins: body.yourWins,
      rivalWins: body.rivalWins,
      streak: body.streak,
      streakHolder: body.rivalWins > body.yourWins ? 'rival' : 'you',
      lastLoss: null,
    });
    return { success: true };
  }

  @Post('notify/weekly-pressure')
  @ApiOperation({ summary: 'Send weekly pressure notification' })
  async sendWeeklyPressure(
    @Body() body: {
      wallet: string;
      rank: number;
      hoursLeft: number;
    },
  ) {
    await this.growthService.sendWeeklyPressureNotification(
      body.wallet,
      body.rank,
      body.hoursLeft,
    );
    return { success: true };
  }
}
