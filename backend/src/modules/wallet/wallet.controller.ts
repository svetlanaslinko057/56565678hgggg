import {
  Controller,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Extract wallet from auth methods
   */
  private async extractWallet(authHeader?: string, walletHeader?: string): Promise<{
    wallet: string | null;
  }> {
    // Check for Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      // Try JWT token
      const jwtPayload = this.authService.verifyJWT(token);
      if (jwtPayload?.wallet) {
        return { wallet: jwtPayload.wallet };
      }
    }

    // Fallback to wallet header
    if (walletHeader) {
      return { wallet: walletHeader };
    }

    return { wallet: null };
  }

  /**
   * Get wallet balance
   * GET /api/wallet/balance
   */
  @Get('balance')
  async getBalance(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    // Real wallet - use wallet service + user profile
    const [balanceData, user] = await Promise.all([
      this.walletService.getBalance(wallet),
      this.usersService.findByWallet(wallet),
    ]);
    
    return ApiResponse.success({
      wallet: balanceData.wallet,
      balance: balanceData.balanceUsdt,
      balanceUsdt: balanceData.balanceUsdt,
      xp: user?.xp || 0,
      tier: user?.tier || 'bronze',
      openPositions: balanceData.openPositions,
      totalPositions: balanceData.totalPositions,
      totalStaked: balanceData.totalStaked,
      realizedPnl: balanceData.realizedPnl,
      isOnChainEnabled: balanceData.isOnChainEnabled,
    });
  }

  /**
   * Get current user profile
   * GET /api/wallet/me
   */
  @Get('me')
  async getMe(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    // Real user profile
    const user = await this.usersService.findByWallet(wallet);
    if (!user) {
      return ApiResponse.error('User not found', 404);
    }

    const balance = await this.walletService.getBalance(wallet);

    return ApiResponse.success({
      wallet: user.wallet,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      xp: user.xp,
      tier: user.tier,
      badges: user.badges || [],
      leaguePoints: user.leaguePoints || 0,
      stats: user.stats,
      duelStats: user.duelStats,
      roi: user.stats?.roi || 0,
      accuracy: user.stats?.accuracy || 0,
      balance: balance.balanceUsdt,
      openPositions: balance.openPositions,
    });
  }

  /**
   * Get wallet positions
   * GET /api/wallet/positions
   */
  @Get('positions')
  async getPositions(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    const positions = await this.walletService.getPositions(wallet, status, limit || 50);
    return ApiResponse.success(positions);
  }

  /**
   * Get wallet NFTs (position NFTs owned)
   * GET /api/wallet/nfts
   */
  @Get('nfts')
  async getNFTs(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    const nfts = await this.walletService.getNFTs(wallet);
    return ApiResponse.success(nfts);
  }

  /**
   * Get wallet transaction history
   * GET /api/wallet/history
   */
  @Get('history')
  async getHistory(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('page') page?: number,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    const history = await this.walletService.getHistory(wallet, type, limit || 50);
    return ApiResponse.success(history);
  }

  /**
   * Get wallet stats summary
   * GET /api/wallet/stats
   */
  @Get('stats')
  async getStats(
    @Headers('authorization') authHeader?: string,
    @Headers('x-wallet-address') walletHeader?: string,
  ) {
    const { wallet } = await this.extractWallet(authHeader, walletHeader);

    if (!wallet) {
      return ApiResponse.error('Wallet not specified', 400);
    }

    const stats = await this.walletService.getStats(wallet);
    return ApiResponse.success(stats);
  }
}
