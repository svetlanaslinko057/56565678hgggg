import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonetizationService } from './monetization.service';

@ApiTags('Monetization')
@Controller('monetization')
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  /**
   * Boost a bet for visibility
   * POST /api/monetization/boost/bet
   */
  @Post('boost/bet')
  @ApiOperation({ summary: 'Boost a bet for visibility' })
  async boostBet(
    @Body() body: { betId: string; boostAmount: number },
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      throw new BadRequestException('Wallet address required');
    }
    if (!body.betId || !body.boostAmount) {
      throw new BadRequestException('betId and boostAmount required');
    }
    const data = await this.monetizationService.boostBet(
      wallet, 
      body.betId, 
      body.boostAmount
    );
    return { success: true, data };
  }

  /**
   * Feature a duel
   * POST /api/monetization/boost/duel
   */
  @Post('boost/duel')
  @ApiOperation({ summary: 'Make a duel featured' })
  async featureDuel(
    @Body() body: { duelId: string; boostAmount: number },
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      throw new BadRequestException('Wallet address required');
    }
    if (!body.duelId || !body.boostAmount) {
      throw new BadRequestException('duelId and boostAmount required');
    }
    const data = await this.monetizationService.featureDuel(
      wallet, 
      body.duelId, 
      body.boostAmount
    );
    return { success: true, data };
  }

  /**
   * Get boosted bets for activity feed
   * GET /api/monetization/boosted/bets
   */
  @Get('boosted/bets')
  @ApiOperation({ summary: 'Get boosted bets for activity feed' })
  async getBoostedBets(@Query('limit') limit: string = '10') {
    const data = await this.monetizationService.getBoostedBets(parseInt(limit) || 10);
    return { success: true, data };
  }

  /**
   * Get featured duels
   * GET /api/monetization/featured/duels
   */
  @Get('featured/duels')
  @ApiOperation({ summary: 'Get featured duels' })
  async getFeaturedDuels(@Query('limit') limit: string = '5') {
    const data = await this.monetizationService.getFeaturedDuels(parseInt(limit) || 5);
    return { success: true, data };
  }

  /**
   * Get pricing info
   * GET /api/monetization/pricing
   */
  @Get('pricing')
  @ApiOperation({ summary: 'Get boost pricing' })
  async getPricing() {
    const data = this.monetizationService.getPricing();
    return { success: true, data };
  }

  /**
   * Get platform fee stats
   * GET /api/monetization/stats
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get monetization stats' })
  async getStats() {
    const data = await this.monetizationService.getStats();
    return { success: true, data };
  }

  /**
   * Get user's boosts history
   * GET /api/monetization/my-boosts
   */
  @Get('my-boosts')
  @ApiOperation({ summary: 'Get user boost history' })
  async getMyBoosts(@Headers('x-wallet-address') wallet: string) {
    if (!wallet) {
      throw new BadRequestException('Wallet address required');
    }
    const data = await this.monetizationService.getUserBoosts(wallet);
    return { success: true, data };
  }

  /**
   * Get dynamic fee based on FOMO level
   * GET /api/monetization/dynamic-fee/:marketId
   */
  @Get('dynamic-fee/:marketId')
  @ApiOperation({ summary: 'Get dynamic fee for market' })
  async getDynamicFee(@Param('marketId') marketId: string) {
    const data = await this.monetizationService.getDynamicFee(marketId);
    return { success: true, data };
  }
}
