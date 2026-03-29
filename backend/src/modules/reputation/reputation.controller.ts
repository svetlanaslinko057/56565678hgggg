import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';

@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get(':wallet')
  @ApiOperation({ summary: 'Get creator reputation' })
  async getReputation(@Param('wallet') wallet: string) {
    const data = await this.reputationService.getByWallet(wallet);
    return { success: true, data };
  }

  @Get(':wallet/stake-requirement')
  @ApiOperation({ summary: 'Get required stake for market creation' })
  async getStakeRequirement(@Param('wallet') wallet: string) {
    const stake = await this.reputationService.getRequiredStake(wallet);
    return { success: true, data: { requiredStake: stake } };
  }

  @Get('leaderboard/creators')
  @ApiOperation({ summary: 'Get creator reputation leaderboard' })
  async getLeaderboard(@Query('limit') limit?: string) {
    const data = await this.reputationService.getLeaderboard(parseInt(limit || '20'));
    return { success: true, data };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get reputation stats summary' })
  async getStats() {
    const data = await this.reputationService.getStats();
    return { success: true, data };
  }
}
