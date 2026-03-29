import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Duel, DuelDocument, DuelStatus } from './duels.schema';
import { Position, PositionDocument } from '../positions/positions.schema';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ArenaGateway } from '../realtime/realtime.gateway';
import { RivalsService } from '../rivals/rivals.service';
import { EVENTS } from '../../events/event-types';

export interface DuelResolutionResult {
  duelId: string;
  winner: string;
  loser: string;
  payout: number;
  xpWinner: number;
  xpLoser: number;
}

@Injectable()
export class DuelResolutionService {
  private readonly logger = new Logger(DuelResolutionService.name);

  // XP rewards
  private readonly XP_DUEL_WIN = 50;
  private readonly XP_DUEL_LOSS = 10;
  private readonly XP_DUEL_PARTICIPATION = 5;

  constructor(
    @InjectModel(Duel.name) private duelModel: Model<DuelDocument>,
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    private ledgerService: LedgerService,
    private notificationsService: NotificationsService,
    private arenaGateway: ArenaGateway,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => RivalsService))
    private rivalsService: RivalsService,
  ) {}

  /**
   * Listen for market resolution events
   */
  @OnEvent(EVENTS.MARKET_RESOLVED)
  async handleMarketResolved(payload: { marketId: string; winningOutcome: string }) {
    this.logger.log(`Market resolved: ${payload.marketId}, outcome: ${payload.winningOutcome}`);
    await this.resolveDuelsForMarket(payload.marketId, payload.winningOutcome);
  }

  /**
   * Resolve all duels for a specific market
   */
  async resolveDuelsForMarket(marketId: string, winningOutcome: string): Promise<DuelResolutionResult[]> {
    // Find all accepted duels for this market
    const duels = await this.duelModel.find({
      marketId,
      status: DuelStatus.ACTIVE,
    });

    this.logger.log(`Found ${duels.length} duels to resolve for market ${marketId}`);

    const results: DuelResolutionResult[] = [];

    for (const duel of duels) {
      try {
        const result = await this.resolveDuel(duel, winningOutcome);
        if (result) {
          results.push(result);
        }
      } catch (e: any) {
        this.logger.error(`Failed to resolve duel ${(duel as any)._id}: ${e.message}`);
      }
    }

    return results;
  }

  /**
   * Resolve a single duel
   */
  async resolveDuel(duel: DuelDocument, winningOutcome: string): Promise<DuelResolutionResult | null> {
    const duelId = (duel as any)._id.toString();

    // Get positions for both players
    const creatorPosition = await this.positionModel.findOne({
      wallet: duel.creatorWallet.toLowerCase(),
      marketId: duel.marketId,
    });

    const opponentPosition = await this.positionModel.findOne({
      wallet: duel.opponentWallet?.toLowerCase(),
      marketId: duel.marketId,
    });

    if (!creatorPosition && !opponentPosition) {
      this.logger.warn(`No positions found for duel ${duelId}`);
      return null;
    }

    // Determine winner based on positions
    const creatorCorrect = creatorPosition?.outcomeId?.toLowerCase() === winningOutcome.toLowerCase();
    const opponentCorrect = opponentPosition?.outcomeId?.toLowerCase() === winningOutcome.toLowerCase();

    let winner: string | null = null;
    let loser: string | null = null;

    if (creatorCorrect && !opponentCorrect) {
      winner = duel.creatorWallet;
      loser = duel.opponentWallet || '';
    } else if (!creatorCorrect && opponentCorrect) {
      winner = duel.opponentWallet || '';
      loser = duel.creatorWallet;
    } else if (creatorCorrect && opponentCorrect) {
      // Both correct - compare by stake/odds or call it a draw
      // For now: higher stake wins, if equal then creator wins
      const creatorStake = creatorPosition?.stake || 0;
      const opponentStake = opponentPosition?.stake || 0;
      
      if (creatorStake >= opponentStake) {
        winner = duel.creatorWallet;
        loser = duel.opponentWallet || '';
      } else {
        winner = duel.opponentWallet || '';
        loser = duel.creatorWallet;
      }
    } else {
      // Both wrong - no winner, refund stakes
      await this.handleDraw(duel);
      return null;
    }

    // Calculate payout
    const totalPot = duel.totalPot || (duel.stakeAmount * 2);
    const platformFee = Math.floor(totalPot * 0.05); // 5% fee
    const payout = totalPot - platformFee;

    // Credit winner
    await this.ledgerService.creditBalance(
      winner,
      payout,
      LedgerType.PAYOUT,
      duelId,
      `Duel win payout`,
    );

    // Update duel
    duel.status = DuelStatus.FINISHED;
    duel.winnerWallet = winner;
    duel.resolvedAt = new Date();
    await duel.save();

    // Award XP
    await this.awardDuelXP(winner, this.XP_DUEL_WIN);
    if (loser) {
      await this.awardDuelXP(loser, this.XP_DUEL_LOSS);
    }

    // Update leaderboard stats
    this.eventEmitter.emit(EVENTS.DUEL_RESULT, {
      duelId,
      winner,
      loser,
      payout,
      marketId: duel.marketId,
    });

    // Send notifications
    await this.notificationsService.create({
      userWallet: winner,
      type: 'duel_won' as any,
      title: 'Duel Won!',
      message: `You won the duel! Payout: $${payout}`,
      payload: { duelId, payout },
    });

    if (loser) {
      await this.notificationsService.create({
        userWallet: loser,
        type: 'duel_lost' as any,
        title: 'Duel Lost',
        message: `You lost the duel. Better luck next time!`,
        payload: { duelId },
      });
    }

    // WebSocket notifications
    this.arenaGateway.notifyUser(winner, {
      type: 'DUEL_WON',
      data: { duelId, payout },
    });

    if (loser) {
      this.arenaGateway.notifyUser(loser, {
        type: 'DUEL_LOST',
        data: { duelId },
      });
    }

    this.logger.log(`Duel ${duelId} resolved: winner=${winner}, payout=${payout}`);

    // Update rivalry stats
    try {
      const rivalry = await this.rivalsService.updateAfterResolvedDuel({
        _id: duelId,
        creatorWallet: duel.creatorWallet,
        opponentWallet: duel.opponentWallet || '',
        winnerWallet: winner,
        stakeAmount: duel.stakeAmount,
      });
      
      if (rivalry && rivalry.currentStreakCount >= 3) {
        // Notify about streak
        const streakWinner = rivalry.currentStreakWallet;
        const streakLoser = streakWinner === duel.creatorWallet ? duel.opponentWallet : duel.creatorWallet;
        
        await this.notificationsService.create({
          userWallet: streakWinner || '',
          type: 'rivalry_streak' as any,
          title: `🔥 ${rivalry.currentStreakCount}-Win Streak!`,
          message: `You're dominating your rivalry!`,
          payload: { rivalryId: (rivalry as any)._id?.toString(), streak: rivalry.currentStreakCount },
        });
        
        if (streakLoser) {
          await this.notificationsService.create({
            userWallet: streakLoser,
            type: 'rivalry_losing' as any,
            title: `💥 Lost ${rivalry.currentStreakCount} in a row`,
            message: `Time for a rematch?`,
            payload: { rivalryId: (rivalry as any)._id?.toString(), streak: rivalry.currentStreakCount },
          });
        }
      }
    } catch (e: any) {
      this.logger.error(`Failed to update rivalry: ${e.message}`);
    }

    return {
      duelId,
      winner,
      loser: loser || '',
      payout,
      xpWinner: this.XP_DUEL_WIN,
      xpLoser: this.XP_DUEL_LOSS,
    };
  }

  /**
   * Handle draw (both players wrong or both equally right)
   */
  private async handleDraw(duel: DuelDocument) {
    const duelId = (duel as any)._id.toString();
    const refundAmount = duel.stakeAmount;

    // Refund both players
    await this.ledgerService.creditBalance(
      duel.creatorWallet,
      refundAmount,
      LedgerType.REFUND,
      duelId,
      'Duel draw - stake refunded',
    );

    if (duel.opponentWallet) {
      await this.ledgerService.creditBalance(
        duel.opponentWallet,
        refundAmount,
        LedgerType.REFUND,
        duelId,
        'Duel draw - stake refunded',
      );
    }

    // Update duel
    duel.status = DuelStatus.FINISHED;
    duel.winnerWallet = undefined;
    duel.resolvedAt = new Date();
    await duel.save();

    // Award participation XP
    await this.awardDuelXP(duel.creatorWallet, this.XP_DUEL_PARTICIPATION);
    if (duel.opponentWallet) {
      await this.awardDuelXP(duel.opponentWallet, this.XP_DUEL_PARTICIPATION);
    }

    // Notify both
    await this.notificationsService.create({
      userWallet: duel.creatorWallet,
      type: 'duel_draw' as any,
      title: 'Duel Draw',
      message: `The duel ended in a draw. Your stake has been refunded.`,
      payload: { duelId, refund: refundAmount },
    });

    if (duel.opponentWallet) {
      await this.notificationsService.create({
        userWallet: duel.opponentWallet,
        type: 'duel_draw' as any,
        title: 'Duel Draw',
        message: `The duel ended in a draw. Your stake has been refunded.`,
        payload: { duelId, refund: refundAmount },
      });
    }

    this.logger.log(`Duel ${duelId} ended in draw, stakes refunded`);
  }

  /**
   * Award XP for duel
   */
  private async awardDuelXP(wallet: string, xp: number) {
    this.eventEmitter.emit(EVENTS.XP_EARNED, {
      wallet,
      amount: xp,
      reason: 'duel_participation',
    });
  }

  /**
   * Get pending duels for resolution (manual trigger)
   */
  async getPendingDuels(): Promise<DuelDocument[]> {
    return this.duelModel.find({
      status: DuelStatus.ACTIVE,
    }).exec();
  }

  /**
   * Manually resolve a specific duel (admin)
   */
  async adminResolveDuel(duelId: string, winnerId: string): Promise<DuelDocument> {
    const duel = await this.duelModel.findById(duelId);
    if (!duel) {
      throw new Error('Duel not found');
    }

    if (duel.status !== DuelStatus.ACTIVE) {
      throw new Error('Duel is not in active status');
    }

    const totalPot = duel.totalPot || (duel.stakeAmount * 2);
    const platformFee = Math.floor(totalPot * 0.05);
    const payout = totalPot - platformFee;

    // Credit winner
    await this.ledgerService.creditBalance(
      winnerId,
      payout,
      LedgerType.PAYOUT,
      duelId,
      'Admin duel resolution payout',
    );

    // Update duel
    duel.status = DuelStatus.FINISHED;
    duel.winnerWallet = winnerId;
    duel.resolvedAt = new Date();
    await duel.save();

    // Award XP
    const loser = winnerId === duel.creatorWallet ? duel.opponentWallet : duel.creatorWallet;
    await this.awardDuelXP(winnerId, this.XP_DUEL_WIN);
    if (loser) {
      await this.awardDuelXP(loser, this.XP_DUEL_LOSS);
    }

    this.logger.log(`Admin resolved duel ${duelId}: winner=${winnerId}`);

    return duel;
  }
}
