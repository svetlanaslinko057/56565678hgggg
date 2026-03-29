import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LedgerEntry, LedgerEntryDocument, LedgerType } from './ledger.schema';
import { UsersService } from '../users/users.service';
import { EVENTS } from '../../events/event-types';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectModel(LedgerEntry.name)
    private ledgerModel: Model<LedgerEntryDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get balance for wallet (from User.balanceUsdt - SOURCE OF TRUTH)
   */
  async getBalance(wallet: string): Promise<number> {
    return this.usersService.getBalance(wallet);
  }

  /**
   * Deduct balance (for bet stake + fee)
   */
  async deductBalance(
    wallet: string,
    amount: number,
    type: LedgerType,
    ref: string,
    description?: string,
  ): Promise<LedgerEntry> {
    const currentBalance = await this.getBalance(wallet);

    if (currentBalance < amount) {
      throw new BadRequestException(`Insufficient balance. Available: ${currentBalance}, Required: ${amount}`);
    }

    // Deduct from User.balanceUsdt (SOURCE OF TRUTH)
    const result = await this.usersService.deductBalance(wallet, amount);
    if (!result.success) {
      throw new BadRequestException(`Failed to deduct balance`);
    }

    // Create ledger entry (audit trail)
    const entry = await this.ledgerModel.create({
      wallet: wallet.toLowerCase(),
      type,
      amount: -amount,
      balanceBefore: currentBalance,
      balanceAfter: result.newBalance,
      ref,
      description,
    });

    this.logger.log(`Deducted ${amount} from ${wallet}. New balance: ${result.newBalance}`);
    
    // Emit balance changed event for WebSocket push
    this.eventEmitter.emit(EVENTS.BALANCE_CHANGED, {
      wallet,
      balance: result.newBalance,
      change: -amount,
      reason: description || type,
    });
    
    return entry;
  }

  /**
   * Credit balance (for payout, refund)
   */
  async creditBalance(
    wallet: string,
    amount: number,
    type: LedgerType,
    ref: string,
    description?: string,
  ): Promise<LedgerEntry> {
    const currentBalance = await this.getBalance(wallet);

    // Credit to User.balanceUsdt (SOURCE OF TRUTH)
    const newBalance = await this.usersService.addBalance(wallet, amount);

    // Create ledger entry (audit trail)
    const entry = await this.ledgerModel.create({
      wallet: wallet.toLowerCase(),
      type,
      amount: amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      ref,
      description,
    });

    this.logger.log(`Credited ${amount} to ${wallet}. New balance: ${newBalance}`);
    
    // Emit balance changed event for WebSocket push
    this.eventEmitter.emit(EVENTS.BALANCE_CHANGED, {
      wallet,
      balance: newBalance,
      change: amount,
      reason: description || type,
    });
    
    return entry;
  }

  /**
   * Get ledger history for wallet
   */
  async getHistory(
    wallet: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: LedgerEntry[]; total: number }> {
    const query = { wallet: wallet.toLowerCase() };

    const [data, total] = await Promise.all([
      this.ledgerModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.ledgerModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Get ledger by position/market reference
   */
  async getByRef(ref: string): Promise<LedgerEntry[]> {
    return this.ledgerModel.find({ ref }).sort({ createdAt: -1 });
  }
}
