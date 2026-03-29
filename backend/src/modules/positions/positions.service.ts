import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Position, PositionDocument, PositionStatus } from './positions.schema';
import { PredictionsService } from '../predictions/predictions.service';
import { UsersService } from '../users/users.service';
import { Web3Service } from '../../infra/web3/web3.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';
import { LiquidityService } from '../liquidity/liquidity.service';
import { PredictionStatus } from '../predictions/predictions.schema';
import { EVENTS } from '../../events/event-types';

export interface BetPreviewResult {
  stake: number;
  odds: number;
  fee: number;
  potentialReturn: number;
  netReturn: number;
  avgPrice: number;
}

export interface PlaceBetDto {
  outcomeId: string;
  stake: number;
}

@Injectable()
export class PositionsService {
  private readonly logger = new Logger(PositionsService.name);
  private readonly PLATFORM_FEE_BPS = 300; // 3% fee

  constructor(
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    private predictionsService: PredictionsService,
    private usersService: UsersService,
    private web3Service: Web3Service,
    private notificationsService: NotificationsService,
    private ledgerService: LedgerService,
    @Inject(forwardRef(() => LiquidityService))
    private liquidityService: LiquidityService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Calculate bet preview - uses AMM for dynamic odds
   */
  async betPreview(marketId: string, dto: PlaceBetDto): Promise<BetPreviewResult> {
    // Get prediction/market
    const prediction = await this.predictionsService.findById(marketId);
    
    // Find outcome
    const outcome = prediction.outcomes?.find(o => 
      o.id === dto.outcomeId || o.label === dto.outcomeId
    );
    
    if (!outcome) {
      throw new BadRequestException('Invalid outcome');
    }

    // Use AMM to get dynamic odds
    const ammPreview = await this.liquidityService.preview(marketId, dto.outcomeId, dto.stake);
    
    // Calculate
    const fee = ammPreview.fee;
    const odds = ammPreview.odds;
    const potentialReturn = ammPreview.potentialReturn;
    const netReturn = potentialReturn - fee;
    const avgPrice = ammPreview.avgPrice;

    return {
      stake: dto.stake,
      odds: Math.round(odds * 100) / 100,
      fee: Math.round(fee * 100) / 100,
      potentialReturn: Math.round(potentialReturn * 100) / 100,
      netReturn: Math.round(netReturn * 100) / 100,
      avgPrice: Math.round(avgPrice * 1000) / 1000,
    };
  }

  /**
   * Place bet - create position and mint NFT
   */
  async placeBet(
    marketId: string,
    wallet: string,
    dto: PlaceBetDto,
  ): Promise<Position> {
    // Get prediction
    const prediction = await this.predictionsService.findById(marketId);
    
    // Validate market is open
    if (prediction.status !== PredictionStatus.PUBLISHED) {
      throw new BadRequestException('Market is not open for betting');
    }

    // Check close time
    if (new Date() >= new Date(prediction.closeTime)) {
      throw new BadRequestException('Market has closed');
    }

    // Find outcome
    const outcome = prediction.outcomes?.find(o => 
      o.id === dto.outcomeId || o.label === dto.outcomeId
    );
    
    if (!outcome) {
      throw new BadRequestException('Invalid outcome');
    }

    // Calculate bet details
    const preview = await this.betPreview(marketId, dto);

    // Note: Balance deduction happens on-chain via smart contract
    // Backend only tracks positions for indexing/display purposes

    // Create position in DB
    const position = await this.positionModel.create({
      marketId,
      predictionId: (prediction as any)._id.toString(),
      outcomeId: dto.outcomeId,
      outcomeLabel: outcome.label,
      stake: dto.stake,
      odds: preview.odds,
      fee: preview.fee,
      potentialReturn: preview.potentialReturn,
      wallet: wallet.toLowerCase(),
      status: PositionStatus.OPEN,
    });

    // Update AMM liquidity pools
    await this.liquidityService.applyBet(marketId, dto.outcomeId, dto.stake);

    // Try to mint NFT on-chain if configured
    if (this.web3Service.getContractAddress() && prediction.chain?.marketId) {
      try {
        // Get outcome index
        const outcomeIndex = prediction.outcomes?.findIndex(o => 
          o.id === dto.outcomeId || o.label === dto.outcomeId
        ) ?? 0;

        // Note: In real implementation, this would call the smart contract
        // For now, we store without actual minting
        this.logger.log(`Position created: ${(position as any)._id}`);
      } catch (error) {
        this.logger.warn(`NFT mint skipped: ${error.message}`);
      }
    }

    // Update user stats
    await this.usersService.updateStatsAfterBet(wallet, dto.stake);

    // Update prediction stats
    await this.predictionsService.updateStats(
      (prediction as any)._id.toString(),
      dto.stake,
      1,
    );

    // Emit BET_PLACED event for real-time updates
    this.eventEmitter.emit(EVENTS.BET_PLACED, {
      wallet,
      positionId: (position as any)._id.toString(),
      marketId,
      marketTitle: prediction.question,
      outcomeId: dto.outcomeId,
      outcomeLabel: outcome.label,
      stake: dto.stake,
      odds: preview.odds,
    });

    // Emit BALANCE_CHANGED event
    const user = await this.usersService.findByWallet(wallet);
    this.eventEmitter.emit(EVENTS.BALANCE_CHANGED, {
      wallet,
      balance: (user as any)?.balanceUsdt || (user as any)?.balance_usdt || 0,
      change: -dto.stake,
      reason: 'bet_placed',
    });

    return position;
  }

  /**
   * Get user's positions
   */
  async getUserPositions(
    wallet: string,
    status?: PositionStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Position[]; total: number }> {
    const query: any = { wallet: wallet.toLowerCase() };
    
    if (status) {
      query.status = status;
    }

    const [data, total] = await Promise.all([
      this.positionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.positionModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Get position by ID
   */
  async getPositionById(id: string): Promise<Position> {
    const position = await this.positionModel.findById(id);
    if (!position) {
      throw new NotFoundException('Position not found');
    }
    return position;
  }

  /**
   * Get positions by market
   */
  async getPositionsByMarket(marketId: string): Promise<Position[]> {
    return this.positionModel.find({ marketId }).sort({ createdAt: -1 });
  }

  /**
   * Resolve positions when market resolves
   */
  async resolvePositions(
    marketId: string,
    winningOutcomeId: string,
  ): Promise<void> {
    // Get all open positions for this market
    const positions = await this.positionModel.find({
      marketId,
      status: PositionStatus.OPEN,
    });

    for (const position of positions) {
      const won = position.outcomeId === winningOutcomeId || 
                  position.outcomeLabel === winningOutcomeId;
      
      const payout = won ? position.potentialReturn : 0;
      const profit = won ? payout - position.stake : -position.stake;

      await this.positionModel.updateOne(
        { _id: position._id },
        {
          status: won ? PositionStatus.WON : PositionStatus.LOST,
          payout,
          profit,
          resolvedAt: new Date(),
        },
      );

      // Update user stats
      await this.usersService.updateStatsAfterResolution(
        position.wallet,
        won,
        profit,
      );

      // Send notification
      try {
        await this.notificationsService.create({
          userWallet: position.wallet,
          type: won ? 'prediction_won' as any : 'prediction_lost' as any,
          title: won ? 'You Won!' : 'Market Resolved',
          message: won 
            ? `Congratulations! You won ${payout} USDT`
            : `Your prediction was incorrect. Better luck next time!`,
          payload: {
            positionId: (position as any)._id.toString(),
            marketId,
            outcome: position.outcomeLabel,
            payout,
            profit,
          },
        });
      } catch (error) {
        this.logger.warn(`Notification failed: ${error.message}`);
      }
    }

    this.logger.log(`Resolved ${positions.length} positions for market ${marketId}`);
  }

  /**
   * Claim payout for won position
   */
  async claimPayout(id: string, wallet: string): Promise<Position> {
    const position = await this.positionModel.findById(id);
    
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.wallet !== wallet.toLowerCase()) {
      throw new BadRequestException('Not your position');
    }

    if (position.status !== PositionStatus.WON) {
      throw new BadRequestException('Position is not claimable');
    }

    position.status = PositionStatus.CLAIMED;
    position.claimedAt = new Date();
    await position.save();

    // Emit claim event
    this.eventEmitter.emit(EVENTS.POSITION_CLAIMED, {
      wallet,
      positionId: id,
      payout: position.payout,
    });

    return position;
  }

  /**
   * Refund position for cancelled market
   */
  async refundPosition(id: string, wallet: string): Promise<Position> {
    const position = await this.positionModel.findById(id);
    
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.wallet !== wallet.toLowerCase()) {
      throw new BadRequestException('Not your position');
    }

    // Check if market is cancelled
    const prediction = await this.predictionsService.findById(position.marketId);
    if (prediction.status !== 'canceled') {
      throw new BadRequestException('Market is not cancelled - cannot refund');
    }

    if (position.status === PositionStatus.CLAIMED) {
      throw new BadRequestException('Position already refunded');
    }

    // Refund stake + fee
    const refundAmount = position.stake + position.fee;

    // Credit balance
    await this.ledgerService.creditBalance(
      wallet,
      refundAmount,
      LedgerType.REFUND,
      id,
      `Refund for cancelled market`,
    );

    position.status = PositionStatus.CLAIMED;
    position.payout = refundAmount;
    position.profit = 0;
    position.claimedAt = new Date();
    await position.save();

    // Update user stats
    await this.usersService.updateStatsAfterBet(wallet, -position.stake); // Reverse the bet stats

    return position;
  }
}
