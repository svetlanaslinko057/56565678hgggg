import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prediction, PredictionDocument, PredictionStatus, ResolutionMode, ResolutionStatus, ResolutionOutcome, OracleMetric } from '../predictions/predictions.schema';
import { Position, PositionDocument, PositionStatus } from '../positions/positions.schema';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SeasonsService } from '../seasons/seasons.service';
import { OracleEngine, OracleResult } from './engines/oracle.engine';
import { AdminEngine, AdminResolveInput } from './engines/admin.engine';

export interface OracleEvaluationResult {
  status: ResolutionStatus;
  outcome?: ResolutionOutcome;
  reason?: string;
  payload?: Record<string, any>;
}

@Injectable()
export class ResolutionService {
  private readonly logger = new Logger(ResolutionService.name);

  constructor(
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    private ledgerService: LedgerService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private seasonsService: SeasonsService,
    private oracleEngine: OracleEngine,
    private adminEngine: AdminEngine,
  ) {}

  /**
   * Lock market - no more bets allowed
   */
  async lockMarket(marketId: string): Promise<Prediction> {
    const prediction = await this.predictionModel.findById(marketId);
    if (!prediction) {
      throw new NotFoundException('Market not found');
    }

    if (prediction.status !== PredictionStatus.PUBLISHED) {
      throw new BadRequestException('Market must be published to lock');
    }

    prediction.status = PredictionStatus.LOCKED;
    await prediction.save();

    this.logger.log(`Market locked: ${marketId}`);
    return prediction;
  }

  /**
   * Resolve market - determine winner, calculate payouts
   */
  async resolveMarket(
    marketId: string,
    resolvedOutcomeId: string,
  ): Promise<{
    market: Prediction;
    positionsResolved: number;
    totalPayout: number;
  }> {
    const prediction = await this.predictionModel.findById(marketId);
    if (!prediction) {
      throw new NotFoundException('Market not found');
    }

    // Debug log
    this.logger.log(`Resolving market ${marketId} with outcome: ${resolvedOutcomeId}`);
    this.logger.log(`Outcomes: ${JSON.stringify(prediction.outcomes)}`);

    // Validate outcome exists - convert to plain objects if needed
    const outcomes = prediction.outcomes?.map(o => ({
      id: o.id,
      label: o.label,
    })) || [];
    
    const outcome = outcomes.find(o => 
      o.id === resolvedOutcomeId || o.label === resolvedOutcomeId
    );
    
    this.logger.log(`Found outcome: ${JSON.stringify(outcome)}`);
    
    if (!outcome) {
      throw new BadRequestException(`Invalid outcome: ${resolvedOutcomeId}. Available: ${outcomes.map(o => o.id).join(', ')}`);
    }

    // Lock first if not locked
    if (prediction.status === PredictionStatus.PUBLISHED) {
      prediction.status = PredictionStatus.LOCKED;
    }

    if (prediction.status !== PredictionStatus.LOCKED) {
      throw new BadRequestException('Market must be locked to resolve');
    }

    // Update market status
    prediction.status = PredictionStatus.RESOLVED;
    prediction.winningOutcome = resolvedOutcomeId;
    prediction.resolveTime = new Date();
    await prediction.save();

    // Get all positions for this market
    const positions = await this.positionModel.find({
      $or: [
        { marketId },
        { predictionId: marketId },
      ],
      status: PositionStatus.OPEN,
    });

    let totalPayout = 0;
    const affectedWallets = new Set<string>();

    for (const position of positions) {
      const won = position.outcomeId === resolvedOutcomeId || 
                  position.outcomeLabel === resolvedOutcomeId;
      
      const payout = won ? position.potentialReturn : 0;
      const profit = won ? payout - position.stake : -position.stake;

      // Update position
      position.status = won ? PositionStatus.WON : PositionStatus.LOST;
      position.payout = payout;
      position.profit = profit;
      position.resolvedAt = new Date();
      await position.save();

      // Note: Payouts happen on-chain via smart contract claim()
      // Backend only tracks for indexing/notifications
      if (won && payout > 0) {
        totalPayout += payout;
      }

      // Update user stats
      await this.usersService.updateStatsAfterResolution(
        position.wallet,
        won,
        profit,
      );

      affectedWallets.add(position.wallet);

      // Send notification
      try {
        await this.notificationsService.create({
          userWallet: position.wallet,
          type: won ? 'prediction_won' as any : 'prediction_lost' as any,
          title: won ? '🎉 You Won!' : 'Market Resolved',
          message: won 
            ? `Congratulations! You won ${payout.toFixed(2)} USDT on "${prediction.question}"`
            : `Your prediction on "${prediction.question}" was incorrect. Better luck next time!`,
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

    // Trigger season stats recalculation for affected users
    for (const wallet of affectedWallets) {
      try {
        await this.seasonsService.recalculateUserStats(wallet);
      } catch (error) {
        this.logger.warn(`Season stats recalc failed for ${wallet}: ${error.message}`);
      }
    }

    this.logger.log(`Market resolved: ${marketId}, Winner: ${resolvedOutcomeId}, Positions: ${positions.length}, Payout: ${totalPayout}`);

    return {
      market: prediction,
      positionsResolved: positions.length,
      totalPayout,
    };
  }

  /**
   * Cancel market - refund all positions
   */
  async cancelMarket(marketId: string, reason: string): Promise<{
    market: Prediction;
    refundedPositions: number;
    totalRefund: number;
  }> {
    const prediction = await this.predictionModel.findById(marketId);
    if (!prediction) {
      throw new NotFoundException('Market not found');
    }

    if (prediction.status === PredictionStatus.RESOLVED) {
      throw new BadRequestException('Cannot cancel resolved market');
    }

    // Update market
    prediction.status = PredictionStatus.CANCELED;
    await prediction.save();

    // Get all open positions
    const positions = await this.positionModel.find({
      $or: [
        { marketId },
        { predictionId: marketId },
      ],
      status: PositionStatus.OPEN,
    });

    let totalRefund = 0;

    for (const position of positions) {
      // Refund stake + fee
      const refundAmount = position.stake + position.fee;
      
      // Note: Refunds happen on-chain via smart contract refund()
      // Backend only tracks for indexing/notifications
      totalRefund += refundAmount;

      // Update position
      position.status = PositionStatus.CLAIMED;
      position.payout = refundAmount;
      position.profit = 0;
      await position.save();

      // Send notification
      try {
        await this.notificationsService.create({
          userWallet: position.wallet,
          type: 'prediction_refund' as any,
          title: 'Market Canceled - Refund',
          message: `Market "${prediction.question}" was canceled. Your ${refundAmount.toFixed(2)} USDT has been refunded.`,
          payload: {
            positionId: (position as any)._id.toString(),
            marketId,
            refund: refundAmount,
            reason,
          },
        });
      } catch (error) {
        this.logger.warn(`Notification failed: ${error.message}`);
      }
    }

    this.logger.log(`Market canceled: ${marketId}, Refunds: ${positions.length}, Total: ${totalRefund}`);

    return {
      market: prediction,
      refundedPositions: positions.length,
      totalRefund,
    };
  }

  // ==================== Oracle Resolution Engine V1 ====================

  /**
   * Evaluate a market for automatic resolution via oracle
   */
  async evaluateMarketForOracle(market: PredictionDocument): Promise<OracleEvaluationResult> {
    const mode = market?.resolution?.mode;

    if (mode === ResolutionMode.ORACLE) {
      const result = await this.oracleEngine.resolve(market);

      if (!result.success) {
        this.logger.warn(`Oracle resolution failed for market ${(market as any)._id}: ${result.reason}`);
        return {
          status: ResolutionStatus.MANUAL_REVIEW,
          reason: result.reason ?? 'Oracle resolution failed, needs manual review',
        };
      }

      return {
        status: ResolutionStatus.AUTO_RESOLVED,
        outcome: result.outcome,
        reason: result.reason,
        payload: result.payload,
      };
    }

    if (mode === ResolutionMode.ADMIN) {
      const check = await this.adminEngine.checkReadyForManualReview(market);
      return {
        status: ResolutionStatus.MANUAL_REVIEW,
        reason: check.reason,
      };
    }

    return {
      status: ResolutionStatus.FAILED,
      reason: `Unknown resolution mode: ${mode}`,
    };
  }

  /**
   * Apply oracle resolution result to market
   */
  async finalizeOracleResolution(
    marketId: string,
    evaluation: OracleEvaluationResult
  ): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    // Update resolution status
    if (!market.resolution) {
      (market as any).resolution = {};
    }

    market.resolution.status = evaluation.status;
    market.resolution.lastOracleCheck = new Date();

    if (evaluation.outcome) {
      market.resolution.resolvedOutcome = evaluation.outcome;
      market.resolution.resolutionReason = evaluation.reason;
      market.resolution.resolutionPayload = evaluation.payload;
      market.resolution.resolvedAt = new Date();
      market.resolution.resolvedBy = evaluation.status === ResolutionStatus.AUTO_RESOLVED ? 'oracle' : 'admin';
    }

    if (evaluation.payload?.actualValue !== undefined) {
      market.resolution.actualValue = evaluation.payload.actualValue;
    }

    // If auto-resolved, also update market status and resolve positions
    if (evaluation.status === ResolutionStatus.AUTO_RESOLVED && evaluation.outcome) {
      market.status = PredictionStatus.RESOLVED;
      market.resolvedAt = new Date();
      market.winningOutcome = evaluation.outcome;
      await market.save();

      // Use existing resolveMarket logic for payout calculation
      await this.resolveMarket(marketId, evaluation.outcome);
    } else if (evaluation.status === ResolutionStatus.MANUAL_REVIEW) {
      market.status = PredictionStatus.LOCKED;
      await market.save();
    } else {
      await market.save();
    }

    this.logger.log(
      `Market ${marketId} oracle resolution finalized: ${evaluation.status} → ${evaluation.outcome || 'pending'}`
    );

    return {
      marketId,
      status: evaluation.status,
      outcome: evaluation.outcome,
      reason: evaluation.reason,
    };
  }

  /**
   * Admin manual resolution using Admin Engine
   */
  async adminResolveMarket(
    marketId: string,
    input: AdminResolveInput
  ): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    if (market.status === PredictionStatus.RESOLVED) {
      throw new BadRequestException('Market is already resolved');
    }

    const result = await this.adminEngine.resolve(market, input);

    if (!result.success) {
      throw new BadRequestException(result.reason);
    }

    // Update market resolution config
    if (!market.resolution) {
      (market as any).resolution = { mode: ResolutionMode.ADMIN };
    }

    market.resolution.status = ResolutionStatus.RESOLVED;
    market.resolution.resolvedOutcome = result.outcome;
    market.resolution.resolutionReason = result.reason;
    market.resolution.resolutionPayload = result.payload;
    market.resolution.resolvedAt = new Date();
    market.resolution.resolvedBy = 'admin';

    await market.save();

    // Use existing resolveMarket logic
    await this.resolveMarket(marketId, result.outcome!);

    this.logger.log(`Admin resolved market ${marketId}: ${result.outcome}`);

    return {
      marketId,
      outcome: result.outcome,
      reason: result.reason,
      resolvedAt: market.resolution.resolvedAt,
    };
  }

  /**
   * Run oracle check on demand (for admin panel)
   */
  async runOracleCheck(marketId: string): Promise<OracleResult> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    const result = await this.oracleEngine.resolve(market);

    // Update last check time and actual value
    if (!market.resolution) {
      (market as any).resolution = {};
    }
    market.resolution.lastOracleCheck = new Date();
    if (result.payload?.actualValue !== undefined) {
      market.resolution.actualValue = result.payload.actualValue;
    }
    await market.save();

    return result;
  }

  /**
   * Get current oracle value for an asset (for UI)
   */
  async getCurrentOracleValue(asset: string, metric: OracleMetric): Promise<{
    value: number | null;
    source: string;
    timestamp: string;
  }> {
    return this.oracleEngine.checkCurrentValue(asset, metric);
  }

  /**
   * Mark market as disputed
   */
  async disputeMarket(marketId: string, reason: string, disputedBy?: string): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    if (!market.resolution) {
      (market as any).resolution = {
        mode: ResolutionMode.ADMIN, // Default mode for disputed markets
        status: ResolutionStatus.DISPUTED,
        disputable: true,
      };
    } else {
      market.resolution.status = ResolutionStatus.DISPUTED;
      market.resolution.disputable = true;
    }

    market.status = PredictionStatus.DISPUTED;

    // Set dispute info
    (market as any).disputeReason = reason;
    (market as any).disputedAt = new Date();
    (market as any).disputedBy = disputedBy || 'user';

    await market.save();

    this.logger.log(`Market ${marketId} disputed: ${reason}`);

    return {
      marketId,
      status: 'disputed',
      reason,
      disputedAt: (market as any).disputedAt,
    };
  }

  /**
   * Get markets pending oracle resolution
   */
  async getMarketsForOracleResolution(): Promise<PredictionDocument[]> {
    const now = new Date();
    
    return this.predictionModel.find({
      closeTime: { $lte: now },
      status: { $in: [PredictionStatus.PUBLISHED, PredictionStatus.LOCKED] },
      'resolution.mode': ResolutionMode.ORACLE,
      'resolution.status': { $in: [ResolutionStatus.PENDING, ResolutionStatus.READY_FOR_CHECK, null] },
    }).exec();
  }

  /**
   * Get resolution statistics
   */
  async getResolutionStats(): Promise<{
    pendingOracle: number;
    pendingAdmin: number;
    autoResolved: number;
    manualResolved: number;
    disputed: number;
  }> {
    const [pendingOracle, pendingAdmin, autoResolved, manualResolved, disputed] = await Promise.all([
      this.predictionModel.countDocuments({
        'resolution.mode': ResolutionMode.ORACLE,
        'resolution.status': { $in: [ResolutionStatus.PENDING, ResolutionStatus.READY_FOR_CHECK] },
      }),
      this.predictionModel.countDocuments({
        'resolution.mode': ResolutionMode.ADMIN,
        'resolution.status': ResolutionStatus.MANUAL_REVIEW,
      }),
      this.predictionModel.countDocuments({
        'resolution.status': ResolutionStatus.AUTO_RESOLVED,
      }),
      this.predictionModel.countDocuments({
        'resolution.status': ResolutionStatus.RESOLVED,
        'resolution.resolvedBy': 'admin',
      }),
      this.predictionModel.countDocuments({
        'resolution.status': ResolutionStatus.DISPUTED,
      }),
    ]);

    return {
      pendingOracle,
      pendingAdmin,
      autoResolved,
      manualResolved,
      disputed,
    };
  }
}
