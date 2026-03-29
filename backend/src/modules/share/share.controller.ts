import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShareService } from './share.service';
import { CreateShareLinkDto, TrackReferralDto } from './share.dto';

@ApiTags('Share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  /**
   * Create shareable link for a position
   */
  @Post('position/:positionId')
  @ApiOperation({ summary: 'Create share link for position' })
  async createShareLink(
    @Param('positionId') positionId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    const data = await this.shareService.createShareLink(wallet, { positionId });
    return { success: true, data };
  }

  /**
   * Get share data for landing page (public)
   */
  @Get(':shareId')
  @ApiOperation({ summary: 'Get share link data' })
  async getShareData(@Param('shareId') shareId: string) {
    const data = await this.shareService.getShareData(shareId);
    return { success: true, data };
  }

  /**
   * Track referral conversion
   */
  @Post('track-referral')
  @ApiOperation({ summary: 'Track referral conversion' })
  async trackReferral(@Body() dto: TrackReferralDto) {
    const data = await this.shareService.trackReferralConversion(dto);
    return { success: true, data };
  }

  /**
   * Award referral bonus (called after first bet)
   */
  @Post('award-bonus')
  @ApiOperation({ summary: 'Award referral bonus after qualifying bet' })
  async awardBonus(
    @Body() body: { wallet: string; stakeAmount: number }
  ) {
    const data = await this.shareService.awardReferralBonus(body.wallet, body.stakeAmount);
    return { success: true, data };
  }

  /**
   * Get user's share statistics
   */
  @Get('stats/me')
  @ApiOperation({ summary: 'Get user share stats' })
  async getMyShareStats(@Headers('x-wallet-address') wallet: string) {
    const data = await this.shareService.getUserShareStats(wallet);
    return { success: true, data };
  }

  /**
   * Get top referrers leaderboard
   */
  @Get('leaderboard/referrers')
  @ApiOperation({ summary: 'Get top referrers' })
  async getTopReferrers(@Query('limit') limit: string = '10') {
    const data = await this.shareService.getTopReferrers(parseInt(limit) || 10);
    return { success: true, data };
  }
}
