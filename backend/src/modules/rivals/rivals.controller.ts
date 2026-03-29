import {
  Controller,
  Get,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { RivalsService } from './rivals.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

/**
 * Rivals Controller
 * Endpoints for rivalry stats, head-to-head, and rematch prep
 */
@Controller('rivals')
export class RivalsController {
  constructor(private readonly rivalsService: RivalsService) {}

  /**
   * Get all rivals for authenticated wallet
   * GET /api/rivals
   */
  @Get()
  async getMyRivals(
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address required');
    }

    const rivals = await this.rivalsService.getRivalsForWallet(walletAddress);
    return ApiResponse.success(rivals, `Found ${rivals.length} rivals`);
  }

  /**
   * Get rivalry summary stats
   * GET /api/rivals/summary
   */
  @Get('summary')
  async getRivalrySummary(
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address required');
    }

    const summary = await this.rivalsService.getRivalrySummary(walletAddress);
    return ApiResponse.success(summary);
  }

  /**
   * Get rivals for specific wallet (public)
   * GET /api/rivals/:wallet
   */
  @Get(':wallet')
  async getRivalsForWallet(
    @Param('wallet') wallet: string,
  ) {
    const rivals = await this.rivalsService.getRivalsForWallet(wallet);
    return ApiResponse.success(rivals, `Found ${rivals.length} rivals`);
  }

  /**
   * Get head-to-head stats between two wallets
   * GET /api/rivals/:wallet/:opponent
   */
  @Get(':wallet/:opponent')
  async getHeadToHead(
    @Param('wallet') wallet: string,
    @Param('opponent') opponent: string,
  ) {
    const h2h = await this.rivalsService.getHeadToHead(wallet, opponent);
    
    if (!h2h) {
      return ApiResponse.success({
        wallet: wallet.toLowerCase(),
        opponent: opponent.toLowerCase(),
        totalDuels: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        lastWinner: null,
        lastDuelAt: null,
        currentStreakWallet: null,
        currentStreakCount: 0,
        dominanceText: 'No duels yet',
      }, 'No rivalry found');
    }

    return ApiResponse.success(h2h);
  }

  /**
   * Get top rival for wallet
   * GET /api/rivals/:wallet/top
   */
  @Get(':wallet/top')
  async getTopRival(
    @Param('wallet') wallet: string,
  ) {
    const topRival = await this.rivalsService.getTopRival(wallet);
    return ApiResponse.success(topRival);
  }

  /**
   * Get nemesis (most losses against) for wallet
   * GET /api/rivals/:wallet/nemesis
   */
  @Get(':wallet/nemesis')
  async getNemesis(
    @Param('wallet') wallet: string,
  ) {
    const nemesis = await this.rivalsService.getNemesis(wallet);
    return ApiResponse.success(nemesis);
  }
}
