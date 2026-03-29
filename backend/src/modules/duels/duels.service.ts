import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Duel, DuelDocument, DuelStatus } from './duels.schema';
import { CreateDuelDto, DuelFiltersDto, DuelSummaryResponse } from './duels.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';
import { UsersService } from '../users/users.service';
import { RivalsService } from '../rivals/rivals.service';

@Injectable()
export class DuelsService {
  private readonly logger = new Logger(DuelsService.name);

  constructor(
    @InjectModel(Duel.name)
    private duelModel: Model<DuelDocument>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => LedgerService))
    private ledgerService: LedgerService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => RivalsService))
    private rivalsService: RivalsService,
  ) {}

  /**
   * Create a new duel
   */
  async create(dto: CreateDuelDto, creatorWallet: string): Promise<Duel> {
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const duel = new this.duelModel({
      marketId: dto.marketId,
      predictionId: dto.predictionId,
      creatorWallet,
      opponentWallet: dto.opponentWallet || null,
      creatorSide: dto.side,
      opponentSide: dto.side === 'yes' ? 'no' : 'yes',
      stakeAmount: dto.stakeAmount,
      totalPot: dto.stakeAmount, // Only creator's stake until opponent joins
      expiresAt,
      status: DuelStatus.PENDING,
      predictionTitle: dto.predictionTitle,
    });

    const savedDuel = await duel.save();
    this.logger.log(`Duel created: ${savedDuel._id} by ${creatorWallet}`);
    
    // Send notification to opponent if specified
    if (dto.opponentWallet) {
      try {
        await this.notificationsService.notifyDuelRequest(
          dto.opponentWallet,
          creatorWallet,
          savedDuel._id.toString(),
          dto.marketId,
          dto.stakeAmount,
          dto.predictionTitle,
        );
      } catch (error) {
        this.logger.warn(`Failed to send duel request notification: ${error.message}`);
      }
    }
    
    return this.sanitizeDuel(savedDuel);
  }

  /**
   * Accept a duel
   */
  async accept(duelId: string, opponentWallet: string): Promise<Duel> {
    const duel = await this.findById(duelId);

    if (duel.status !== DuelStatus.PENDING) {
      throw new BadRequestException('Can only accept pending duels');
    }

    if (duel.creatorWallet === opponentWallet) {
      throw new BadRequestException('Cannot accept your own duel');
    }

    // Check if duel is expired
    if (new Date() > duel.expiresAt) {
      duel.status = DuelStatus.EXPIRED;
      await duel.save();
      throw new BadRequestException('Duel has expired');
    }

    // If duel was created for specific opponent, verify
    if (duel.opponentWallet && duel.opponentWallet !== opponentWallet) {
      throw new BadRequestException('This duel is for a specific opponent');
    }

    duel.opponentWallet = opponentWallet;
    duel.status = DuelStatus.ACTIVE;
    duel.totalPot = duel.stakeAmount * 2;

    const savedDuel = await duel.save();
    this.logger.log(`Duel accepted: ${duelId} by ${opponentWallet}`);
    
    // Notify creator that duel was accepted
    try {
      await this.notificationsService.notifyDuelAccepted(
        duel.creatorWallet,
        opponentWallet,
        duelId,
        duel.marketId,
        duel.totalPot,
      );
    } catch (error) {
      this.logger.warn(`Failed to send duel accepted notification: ${error.message}`);
    }
    
    return this.sanitizeDuel(savedDuel);
  }

  /**
   * Decline a duel
   */
  async decline(duelId: string, wallet: string): Promise<Duel> {
    const duel = await this.findById(duelId);

    if (duel.status !== DuelStatus.PENDING) {
      throw new BadRequestException('Can only decline pending duels');
    }

    // Only specified opponent or creator can decline
    if (duel.opponentWallet && duel.opponentWallet !== wallet && duel.creatorWallet !== wallet) {
      throw new BadRequestException('Not authorized to decline this duel');
    }

    duel.status = DuelStatus.DECLINED;
    const savedDuel = await duel.save();
    this.logger.log(`Duel declined: ${duelId} by ${wallet}`);
    
    // Notify creator if declined by opponent
    if (wallet !== duel.creatorWallet) {
      try {
        await this.notificationsService.notifyDuelDeclined(
          duel.creatorWallet,
          wallet,
          duelId,
        );
      } catch (error) {
        this.logger.warn(`Failed to send duel declined notification: ${error.message}`);
      }
    }
    
    return this.sanitizeDuel(savedDuel);
  }

  /**
   * Cancel a duel (creator only)
   */
  async cancel(duelId: string, wallet: string): Promise<Duel> {
    const duel = await this.findById(duelId);

    if (duel.creatorWallet !== wallet) {
      throw new BadRequestException('Only creator can cancel the duel');
    }

    if (duel.status === DuelStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel active duels');
    }

    if ([DuelStatus.FINISHED, DuelStatus.CANCELED].includes(duel.status as DuelStatus)) {
      throw new BadRequestException('Duel is already finished or canceled');
    }

    duel.status = DuelStatus.CANCELED;
    const savedDuel = await duel.save();
    this.logger.log(`Duel canceled: ${duelId} by ${wallet}`);
    
    return this.sanitizeDuel(savedDuel);
  }

  /**
   * Get all duels with filters
   */
  async findAll(
    filters: DuelFiltersDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Duel[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.wallet) {
      query.$or = [
        { creatorWallet: filters.wallet },
        { opponentWallet: filters.wallet },
      ];
    }

    if (filters.marketId) {
      query.marketId = filters.marketId;
    }

    const [data, total] = await Promise.all([
      this.duelModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.duelModel.countDocuments(query).exec(),
    ]);

    return { 
      data: data.map(d => this.sanitizeDuelObject(d)), 
      total 
    };
  }

  /**
   * Get duel by ID
   */
  async findById(id: string): Promise<DuelDocument> {
    const duel = await this.duelModel.findById(id).exec();
    if (!duel) {
      throw new NotFoundException('Duel not found');
    }
    return duel;
  }

  /**
   * Get duel summary for a user
   */
  async getSummary(wallet: string): Promise<DuelSummaryResponse> {
    const userDuels = await this.duelModel
      .find({
        $or: [
          { creatorWallet: wallet },
          { opponentWallet: wallet },
        ],
      })
      .lean()
      .exec();

    const activeDuels = userDuels.filter(d => d.status === DuelStatus.ACTIVE).length;
    const finishedDuels = userDuels.filter(d => d.status === DuelStatus.FINISHED);

    let wins = 0;
    let losses = 0;

    for (const duel of finishedDuels) {
      if (duel.winnerWallet === wallet) {
        wins++;
      } else if (duel.winnerWallet) {
        losses++;
      }
    }

    // Calculate current streak
    const sortedFinished = finishedDuels
      .filter(d => d.resolvedAt)
      .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime());

    let streak = 0;
    for (const duel of sortedFinished) {
      if (duel.winnerWallet === wallet) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let currentStreak = 0;
    for (const duel of sortedFinished.reverse()) {
      if (duel.winnerWallet === wallet) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const totalDuels = wins + losses;
    const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;

    return {
      activeDuels,
      wins,
      losses,
      streak,
      winRate,
      totalDuels,
      bestStreak,
    };
  }

  /**
   * Get open duels (pending duels without specific opponent)
   */
  async getOpenDuels(page: number = 1, limit: number = 20): Promise<{ data: Duel[]; total: number }> {
    const query = {
      status: DuelStatus.PENDING,
      opponentWallet: { $in: [null, ''] },
      expiresAt: { $gt: new Date() },
    };

    const [data, total] = await Promise.all([
      this.duelModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.duelModel.countDocuments(query).exec(),
    ]);

    return { 
      data: data.map(d => this.sanitizeDuelObject(d)), 
      total 
    };
  }

  /**
   * Get user's duels history
   */
  async getUserHistory(
    wallet: string,
    type: 'all' | 'active' | 'settled' = 'all',
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Duel[]; total: number }> {
    const query: any = {
      $or: [
        { creatorWallet: wallet },
        { opponentWallet: wallet },
      ],
    };

    if (type === 'active') {
      query.status = { $in: [DuelStatus.PENDING, DuelStatus.ACTIVE] };
    } else if (type === 'settled') {
      query.status = { $in: [DuelStatus.FINISHED, DuelStatus.DECLINED, DuelStatus.CANCELED, DuelStatus.EXPIRED] };
    }

    const [data, total] = await Promise.all([
      this.duelModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.duelModel.countDocuments(query).exec(),
    ]);

    return { 
      data: data.map(d => this.sanitizeDuelObject(d)), 
      total 
    };
  }

  /**
   * Expire pending duels that have passed their expiration time
   */
  async expireOldDuels(): Promise<number> {
    const result = await this.duelModel.updateMany(
      {
        status: DuelStatus.PENDING,
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: DuelStatus.EXPIRED },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Expired ${result.modifiedCount} duels`);
    }

    return result.modifiedCount;
  }

  /**
   * Get top rivals for a user
   */
  async getTopRivals(wallet: string, limit: number = 5): Promise<any[]> {
    const finishedDuels = await this.duelModel
      .find({
        $or: [
          { creatorWallet: wallet },
          { opponentWallet: wallet },
        ],
        status: DuelStatus.FINISHED,
      })
      .lean()
      .exec();

    // Count wins/losses against each opponent
    const rivalStats: Map<string, { wins: number; losses: number }> = new Map();

    for (const duel of finishedDuels) {
      const opponent = duel.creatorWallet === wallet ? duel.opponentWallet : duel.creatorWallet;
      if (!opponent) continue;

      if (!rivalStats.has(opponent)) {
        rivalStats.set(opponent, { wins: 0, losses: 0 });
      }

      const stats = rivalStats.get(opponent)!;
      if (duel.winnerWallet === wallet) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    }

    // Convert to array and sort by total matches
    const rivals = Array.from(rivalStats.entries())
      .map(([wallet, stats]) => ({
        wallet,
        wins: stats.wins,
        losses: stats.losses,
        totalMatches: stats.wins + stats.losses,
      }))
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, limit);

    return rivals;
  }

  // Helper to convert MongoDB document to plain object without _id
  private sanitizeDuel(doc: DuelDocument): Duel {
    const obj = doc.toObject();
    const { _id, __v, ...rest } = obj;
    return { id: _id.toString(), ...rest } as any;
  }

  private sanitizeDuelObject(obj: any): Duel {
    const { _id, __v, ...rest } = obj;
    return { id: _id?.toString(), ...rest } as any;
  }

  /**
   * Resolve all duels for a market when market is resolved
   */
  async resolveByMarket(marketId: string, winningOutcome: string): Promise<number> {
    const duels = await this.duelModel.find({
      marketId,
      status: DuelStatus.ACTIVE,
    });

    let resolved = 0;

    for (const duel of duels) {
      try {
        // Determine winner based on outcome
        const creatorWon = duel.creatorSide.toLowerCase() === winningOutcome.toLowerCase();
        const winnerWallet = creatorWon ? duel.creatorWallet : duel.opponentWallet;
        const loserWallet = creatorWon ? duel.opponentWallet : duel.creatorWallet;

        // Calculate payout (total pot minus fee)
        const fee = duel.totalPot * 0.02; // 2% fee
        const payout = duel.totalPot - fee;

        // Update duel
        duel.status = DuelStatus.FINISHED;
        duel.winnerWallet = winnerWallet;
        duel.resolvedAt = new Date();
        await duel.save();

        // Credit winner's balance
        if (winnerWallet) {
          await this.ledgerService.creditBalance(
            winnerWallet,
            payout,
            LedgerType.PAYOUT,
            duel._id.toString(),
            `Won duel against ${loserWallet}`,
          );

          // Update XP - winner gets 50, loser gets 10
          await this.usersService.adjustXp(winnerWallet, 50);
        }
        if (loserWallet) {
          await this.usersService.adjustXp(loserWallet, 10);
        }

        // Update streak
        if (winnerWallet) {
          await this.usersService.updateStreak(winnerWallet, true);
        }
        if (loserWallet) {
          await this.usersService.updateStreak(loserWallet, false);
        }

        // Send notifications
        try {
          if (winnerWallet) {
            await this.notificationsService.create({
              userWallet: winnerWallet,
              type: 'duel_won' as any,
              title: '🏆 Duel Victory!',
              message: `You won the duel! ${payout.toFixed(2)} USDT has been credited to your balance.`,
              payload: { duelId: duel._id.toString(), payout },
            });
          }
          if (loserWallet) {
            await this.notificationsService.create({
              userWallet: loserWallet,
              type: 'duel_lost' as any,
              title: 'Duel Result',
              message: `You lost the duel. Better luck next time!`,
              payload: { duelId: duel._id.toString() },
            });
          }
        } catch (e) {
          this.logger.warn(`Notification failed: ${e.message}`);
        }

        // Update rivalry stats
        try {
          if (winnerWallet && duel.creatorWallet && duel.opponentWallet) {
            await this.rivalsService.updateAfterResolvedDuel({
              _id: duel._id.toString(),
              creatorWallet: duel.creatorWallet,
              opponentWallet: duel.opponentWallet,
              winnerWallet,
              stakeAmount: duel.stakeAmount,
            });
          }
        } catch (e) {
          this.logger.warn(`Rivalry update failed: ${e.message}`);
        }

        resolved++;
        this.logger.log(`Duel ${duel._id} resolved. Winner: ${winnerWallet}`);
      } catch (error) {
        this.logger.error(`Failed to resolve duel ${duel._id}: ${error.message}`);
      }
    }

    return resolved;
  }
}
