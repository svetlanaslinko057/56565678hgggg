import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MirrorService } from './mirror.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

/**
 * MIRROR CONTROLLER
 * API endpoints for on-chain data from indexer
 */
@ApiTags('onchain')
@Controller('onchain')
export class MirrorController {
  constructor(private readonly mirrorService: MirrorService) {}
  
  /**
   * FOMO ENGINE - Market Pressure & Sentiment
   */
  @Get('markets/:marketId/pressure')
  @ApiOperation({ summary: 'Get market FOMO pressure (activity, sentiment, pressure level)' })
  async getMarketPressure(@Param('marketId') marketId: string) {
    const data = await this.mirrorService.getMarketPressure(parseInt(marketId));
    return { success: true, data };
  }
  
  @Get('markets')
  @ApiOperation({ summary: 'Get on-chain markets' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by: createdAt, trending, volume, bets' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc, desc' })
  async getMarkets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.mirrorService.getOnchainMarkets({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: (sortBy as any) || 'createdAt',
      sortOrder: (sortOrder as any) || 'desc',
    });
  }
  
  @Get('markets/:marketId')
  @ApiOperation({ summary: 'Get single on-chain market' })
  async getMarket(@Param('marketId') marketId: string) {
    const market = await this.mirrorService.getOnchainMarket(parseInt(marketId));
    return { success: true, data: market };
  }
  
  @Get('positions')
  @ApiOperation({ summary: 'Get user positions' })
  @ApiQuery({ name: 'owner', required: true })
  @ApiQuery({ name: 'status', required: false })
  async getPositions(
    @Query('owner') owner: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mirrorService.getUserPositions(owner, {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
  
  @Get('positions/tokens/:owner')
  @ApiOperation({ summary: 'Get user token IDs' })
  async getUserTokenIds(@Param('owner') owner: string) {
    const tokenIds = await this.mirrorService.getUserTokenIds(owner);
    return { success: true, data: tokenIds };
  }
  
  @Get('activities')
  @ApiOperation({ summary: 'Get on-chain activities feed' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'user', required: false })
  async getActivities(
    @Query('type') type?: string,
    @Query('user') user?: string,
    @Query('marketId') marketId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mirrorService.getActivities({
      type,
      user,
      marketId: marketId ? parseInt(marketId) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
  
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get on-chain leaderboard' })
  async getLeaderboard(@Query('limit') limit?: string) {
    const data = await this.mirrorService.getOnchainLeaderboard(
      limit ? parseInt(limit) : 20
    );
    return { success: true, data };
  }
  
  @Get('stats')
  @ApiOperation({ summary: 'Get on-chain stats' })
  async getStats() {
    const data = await this.mirrorService.getOnchainStats();
    return { success: true, data };
  }
  
  @Get('indexer/status')
  @ApiOperation({ summary: 'Get indexer sync status' })
  async getIndexerStatus() {
    const data = await this.mirrorService.getIndexerStatus();
    return { success: true, data };
  }
  
  @Get('config')
  @ApiOperation({ summary: 'Get contract config from chain' })
  async getContractConfig() {
    const data = await this.mirrorService.getContractConfig();
    return { success: true, data };
  }
  
  @Get('profile/:wallet')
  @ApiOperation({ summary: 'Get user profile stats from on-chain data' })
  async getUserProfile(@Param('wallet') wallet: string) {
    const data = await this.mirrorService.getUserProfile(wallet);
    return { success: true, data };
  }
  
  @Post('webhook/event')
  @ApiOperation({ summary: 'Webhook for indexer events to trigger notifications' })
  async handleIndexerEvent(@Body() body: {
    type: string;
    user?: string;
    marketId?: number;
    tokenId?: number;
    amount?: string;
    outcome?: number;
    question?: string;
    txHash?: string;
  }) {
    const result = await this.mirrorService.processIndexerEvent(body);
    return { success: true, data: result };
  }
}
