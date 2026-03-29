import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { MirrorService } from './mirror.service';

@Controller('indexer')
export class IndexerController {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly mirrorService: MirrorService,
  ) {}

  @Get('status')
  async getStatus() {
    const syncState = await this.mirrorService.getSyncState();
    return {
      success: true,
      data: {
        ...this.indexerService.getStatus(),
        syncState,
      },
    };
  }

  @Post('simulate')
  async simulate() {
    await this.indexerService.simulateContractEvents();
    return {
      success: true,
      message: 'Contract events simulated',
    };
  }

  // ============ Mirror Data Endpoints ============

  @Get('mirror/markets')
  async getMirrorMarkets(
    @Query('status') status?: string,
    @Query('creator') creator?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const markets = await this.mirrorService.getMarkets({
      status,
      creator,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    return { success: true, data: markets };
  }

  @Get('mirror/markets/:chainMarketId')
  async getMirrorMarket(@Param('chainMarketId') chainMarketId: string) {
    const market = await this.mirrorService.getMarket(chainMarketId);
    if (!market) {
      return { success: false, error: 'Market not found' };
    }
    const stats = await this.mirrorService.getMarketStats(chainMarketId);
    return { success: true, data: { ...market, stats } };
  }

  @Get('mirror/markets/:chainMarketId/positions')
  async getMirrorMarketPositions(@Param('chainMarketId') chainMarketId: string) {
    const positions = await this.mirrorService.getPositionsByMarket(chainMarketId);
    return { success: true, data: positions };
  }

  @Get('mirror/markets/:chainMarketId/stats')
  async getMirrorMarketStats(@Param('chainMarketId') chainMarketId: string) {
    const stats = await this.mirrorService.getMarketStats(chainMarketId);
    return { success: true, data: stats };
  }

  @Get('mirror/markets/:chainMarketId/bets')
  async getMirrorMarketBets(
    @Param('chainMarketId') chainMarketId: string,
    @Query('limit') limit?: string,
  ) {
    const bets = await this.mirrorService.getLiveBets(chainMarketId, limit ? parseInt(limit) : 20);
    return { success: true, data: bets };
  }

  @Get('mirror/positions/:tokenId')
  async getMirrorPosition(@Param('tokenId') tokenId: string) {
    const position = await this.mirrorService.getPosition(tokenId);
    if (!position) {
      return { success: false, error: 'Position not found' };
    }
    return { success: true, data: position };
  }

  @Get('mirror/positions/owner/:wallet')
  async getMirrorPositionsByOwner(
    @Param('wallet') wallet: string,
    @Query('chainMarketId') chainMarketId?: string,
    @Query('claimed') claimed?: string,
    @Query('limit') limit?: string,
  ) {
    const positions = await this.mirrorService.getPositionsByOwner(wallet, {
      chainMarketId,
      claimed: claimed === 'true' ? true : claimed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data: positions };
  }

  @Get('mirror/positions/claimable/:wallet')
  async getClaimablePositions(@Param('wallet') wallet: string) {
    const winning = await this.mirrorService.getWinningPositions(wallet);
    const refundable = await this.mirrorService.getRefundablePositions(wallet);
    return { 
      success: true, 
      data: { 
        winning,
        refundable,
        totalClaimable: winning.length + refundable.length,
      } 
    };
  }

  @Get('mirror/activity')
  async getMirrorActivity(
    @Query('wallet') wallet?: string,
    @Query('chainMarketId') chainMarketId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const activities = await this.mirrorService.getActivityFeed({
      wallet,
      chainMarketId,
      type,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data: activities };
  }

  @Get('mirror/tx/:txHash')
  async getTxState(@Param('txHash') txHash: string) {
    const state = await this.mirrorService.getTxState(txHash);
    return { success: true, data: state };
  }

  @Get('mirror/tx/pending/:wallet')
  async getPendingTxs(@Param('wallet') wallet: string) {
    const txs = await this.mirrorService.getPendingTxs(wallet);
    return { success: true, data: txs };
  }

  @Post('mirror/tx/track')
  async trackTx(
    @Body() body: {
      txHash: string;
      type: string;
      wallet?: string;
      tokenId?: string;
      chainMarketId?: string;
    },
  ) {
    await this.mirrorService.trackPendingTx(body);
    return { success: true };
  }

  @Get('mirror/notifications/:wallet')
  async getNotifications(
    @Param('wallet') wallet: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const notifications = await this.mirrorService.getNotifications(
      wallet, 
      unreadOnly === 'true'
    );
    return { success: true, data: notifications };
  }

  @Post('mirror/notifications/:wallet/read')
  async markNotificationsRead(@Param('wallet') wallet: string) {
    await this.mirrorService.markNotificationsRead(wallet);
    return { success: true };
  }
}
