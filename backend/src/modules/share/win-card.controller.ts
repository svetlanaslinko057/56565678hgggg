import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WinCardService } from './win-card.service';

@ApiTags('Win Cards')
@Controller('share')
export class WinCardController {
  constructor(private readonly winCardService: WinCardService) {}

  /**
   * Generate win card data for a position
   * GET /api/share/win/:positionId
   */
  @Get('win/:positionId')
  @ApiOperation({ summary: 'Get win card data for position' })
  async getWinCardData(
    @Param('positionId') positionId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    const data = await this.winCardService.generateWinCardData(positionId, wallet);
    return { success: true, data };
  }

  /**
   * Track share action
   * POST /api/share/win/:positionId/track
   */
  @Post('win/:positionId/track')
  @ApiOperation({ summary: 'Track win card share action' })
  async trackShare(
    @Param('positionId') positionId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    const result = await this.winCardService.trackShare(positionId, wallet);
    return { success: true, data: result };
  }

  /**
   * Get user's win history for profile "Recent Wins"
   * GET /api/share/wins/recent
   */
  @Get('wins/recent')
  @ApiOperation({ summary: 'Get recent wins for user' })
  async getRecentWins(
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      throw new BadRequestException('Wallet address required');
    }
    const data = await this.winCardService.getRecentWins(wallet);
    return { success: true, data };
  }
}
