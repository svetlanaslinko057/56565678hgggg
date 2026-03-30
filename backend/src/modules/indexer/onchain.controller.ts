import { Controller, Get, Post, Query, Param, Body, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EconomyService } from '../economy/economy.service';

/**
 * Onchain Controller
 * 
 * Handles on-chain data queries and webhook events from indexer
 */
@Controller('onchain')
export class OnchainController {
  private readonly logger = new Logger(OnchainController.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private economyService: EconomyService,
  ) {}

  private get positionsCollection() {
    return this.connection.collection('positions_mirror');
  }

  private get marketsCollection() {
    return this.connection.collection('markets_mirror');
  }

  /**
   * Get positions by owner wallet
   */
  @Get('positions')
  async getPositions(
    @Query('owner') owner?: string,
    @Query('marketId') marketId?: string,
    @Query('status') status?: string,
  ) {
    const filter: any = {};
    if (owner) filter.owner = owner.toLowerCase();
    if (marketId) filter.marketId = parseInt(marketId);
    if (status) filter.status = status;

    const positions = await this.positionsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with market data
    const enriched = await Promise.all(
      positions.map(async (pos) => {
        const market = await this.marketsCollection.findOne({ marketId: pos.marketId });
        return {
          ...pos,
          _id: undefined,
          marketQuestion: market?.question || `Market #${pos.marketId}`,
          outcomeLabel: pos.outcome === 0 ? (market?.optionA || 'YES') : (market?.optionB || 'NO'),
          amountFormatted: (parseFloat(pos.amount) / 1e18).toFixed(2),
        };
      })
    );

    return { success: true, data: enriched };
  }

  /**
   * Get position by token ID
   */
  @Get('positions/:tokenId')
  async getPosition(@Param('tokenId') tokenId: string) {
    const position = await this.positionsCollection.findOne({ tokenId: parseInt(tokenId) });
    
    if (!position) {
      return { success: false, error: 'Position not found' };
    }

    const market = await this.marketsCollection.findOne({ marketId: position.marketId });

    return {
      success: true,
      data: {
        ...position,
        _id: undefined,
        marketQuestion: market?.question || `Market #${position.marketId}`,
        outcomeLabel: position.outcome === 0 ? (market?.optionA || 'YES') : (market?.optionB || 'NO'),
        amountFormatted: (parseFloat(position.amount) / 1e18).toFixed(2),
      },
    };
  }

  /**
   * Webhook endpoint for indexer events
   * Routes blockchain events to economy service for XP awards
   */
  @Post('webhook/event')
  async handleWebhookEvent(@Body() body: any) {
    const { type, ...data } = body;

    this.logger.log(`Webhook event received: ${type}`);

    try {
      switch (type) {
        case 'bet_placed':
          await this.economyService.onBetPlaced({
            wallet: data.wallet,
            marketId: data.marketId,
            tokenId: data.tokenId,
            amount: data.amount,
            outcome: data.outcome,
            txHash: data.txHash,
          });
          break;

        case 'position_won':
          await this.economyService.onPositionWon({
            wallet: data.wallet,
            marketId: data.marketId,
            tokenId: data.tokenId,
            amount: data.amount,
            payout: data.payout,
            question: data.question,
            txHash: data.txHash,
          });
          break;

        case 'position_lost':
          await this.economyService.onPositionLost({
            wallet: data.wallet,
            marketId: data.marketId,
            tokenId: data.tokenId,
            amount: data.amount,
            question: data.question,
            txHash: data.txHash,
          });
          break;

        case 'position_claimed':
          await this.economyService.onPositionClaimed({
            wallet: data.wallet,
            tokenId: data.tokenId,
            netAmount: data.netAmount,
            feeAmount: data.feeAmount,
            txHash: data.txHash,
          });
          break;

        default:
          this.logger.warn(`Unknown webhook event type: ${type}`);
      }

      return { success: true };
    } catch (err) {
      this.logger.error(`Webhook event error: ${err}`);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get economy leaderboard
   */
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const leaderboard = await this.economyService.getLeaderboard(
      limit ? parseInt(limit) : 20
    );
    return { success: true, data: leaderboard };
  }

  /**
   * Get user economy stats
   */
  @Get('stats/:wallet')
  async getUserStats(@Param('wallet') wallet: string) {
    const stats = await this.economyService.getUserEconomyStats(wallet);
    return { success: true, data: stats };
  }
}
