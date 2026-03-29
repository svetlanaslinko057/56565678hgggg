import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArenaUser, ArenaUserDocument, UserSource, UserTier } from './users.schema';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserDto {
  wallet: string;
  username?: string;
  platformUserId?: string;
  telegramId?: string;
  source?: UserSource;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(ArenaUser.name)
    private userModel: Model<ArenaUserDocument>,
  ) {}

  /**
   * Get or create user by wallet address (main identity)
   */
  async getOrCreateUser(dto: CreateUserDto): Promise<ArenaUser> {
    const wallet = dto.wallet.toLowerCase();
    
    let user = await this.userModel.findOne({ wallet });
    
    if (!user) {
      user = await this.userModel.create({
        wallet,
        username: dto.username || `User_${wallet.slice(2, 8)}`,
        source: dto.source || UserSource.ARENA,
        platformUserId: dto.platformUserId,
        telegramId: dto.telegramId,
        nonce: uuidv4(),
      });
      this.logger.log(`Created new user: ${wallet}`);
    } else {
      // Link additional identities if provided
      if (dto.platformUserId && !user.platformUserId) {
        user.platformUserId = dto.platformUserId;
      }
      if (dto.telegramId && !user.telegramId) {
        user.telegramId = dto.telegramId;
      }
      await user.save();
    }
    
    return user;
  }

  /**
   * Find user by wallet
   */
  async findByWallet(wallet: string): Promise<ArenaUser | null> {
    return this.userModel.findOne({ wallet: wallet.toLowerCase() });
  }

  /**
   * Find user by platform ID
   */
  async findByPlatformUserId(platformUserId: string): Promise<ArenaUser | null> {
    return this.userModel.findOne({ platformUserId });
  }

  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: string): Promise<ArenaUser | null> {
    return this.userModel.findOne({ telegramId });
  }

  /**
   * Generate new nonce for wallet signature
   */
  async generateNonce(wallet: string): Promise<string> {
    const nonce = uuidv4();
    const user = await this.userModel.findOne({ wallet: wallet.toLowerCase() });
    
    if (user) {
      user.nonce = nonce;
      await user.save();
    } else {
      // Pre-create user with nonce
      await this.userModel.create({
        wallet: wallet.toLowerCase(),
        nonce,
        username: `User_${wallet.slice(2, 8)}`,
      });
    }
    
    return nonce;
  }

  /**
   * Get nonce for wallet
   */
  async getNonce(wallet: string): Promise<string | null> {
    const user = await this.userModel.findOne({ wallet: wallet.toLowerCase() });
    return user?.nonce || null;
  }

  /**
   * Update last login
   */
  async updateLastLogin(wallet: string): Promise<void> {
    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { lastLoginAt: new Date() },
    );
  }

  /**
   * Update user stats after bet
   */
  async updateStatsAfterBet(
    wallet: string,
    stake: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      {
        $inc: {
          'stats.totalBets': 1,
          'stats.totalStaked': stake,
          xp: 10, // XP for placing bet
        },
      },
    );
  }

  /**
   * Update user stats after resolution
   */
  async updateStatsAfterResolution(
    wallet: string,
    won: boolean,
    profit: number,
  ): Promise<void> {
    const update: any = {
      $inc: {
        'stats.totalProfit': profit,
      },
    };

    if (won) {
      update.$inc['stats.wins'] = 1;
      update.$inc['xp'] = 50; // XP for winning
    } else {
      update.$inc['stats.losses'] = 1;
    }

    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      update,
    );

    // Recalculate ROI and accuracy
    await this.recalculateStats(wallet);
  }

  /**
   * Recalculate user stats
   */
  async recalculateStats(wallet: string): Promise<void> {
    const user = await this.findByWallet(wallet);
    if (!user) return;

    const totalBets = user.stats.wins + user.stats.losses;
    const accuracy = totalBets > 0 ? (user.stats.wins / totalBets) * 100 : 0;
    const roi = user.stats.totalStaked > 0 
      ? (user.stats.totalProfit / user.stats.totalStaked) * 100 
      : 0;

    // Calculate league points
    const leaguePoints = Math.round(
      user.stats.totalProfit +
      (user.duelStats.wins * 50) +
      (user.duelStats.losses * -20) +
      (accuracy * 10)
    );

    // Determine tier
    let tier = UserTier.BRONZE;
    if (leaguePoints >= 10000) tier = UserTier.DIAMOND;
    else if (leaguePoints >= 5000) tier = UserTier.PLATINUM;
    else if (leaguePoints >= 2000) tier = UserTier.GOLD;
    else if (leaguePoints >= 500) tier = UserTier.SILVER;

    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      {
        'stats.accuracy': Math.round(accuracy * 100) / 100,
        'stats.roi': Math.round(roi * 100) / 100,
        leaguePoints,
        tier,
      },
    );
  }

  /**
   * Update user profile
   */
  async updateProfile(
    wallet: string,
    updates: { username?: string; avatar?: string; bio?: string },
  ): Promise<ArenaUser | null> {
    return this.userModel.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { $set: updates },
      { new: true },
    );
  }

  // ========== BALANCE OPERATIONS (SOURCE OF TRUTH) ==========

  /**
   * Get user balance
   */
  async getBalance(wallet: string): Promise<number> {
    const user = await this.findByWallet(wallet);
    return user?.balanceUsdt || 0;
  }

  /**
   * Add balance (deposit, payout, refund)
   */
  async addBalance(wallet: string, amount: number): Promise<number> {
    const result = await this.userModel.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { $inc: { balanceUsdt: amount } },
      { new: true },
    );
    return result?.balanceUsdt || 0;
  }

  /**
   * Deduct balance (bet, fee)
   */
  async deductBalance(wallet: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
    const user = await this.findByWallet(wallet);
    if (!user || user.balanceUsdt < amount) {
      return { success: false, newBalance: user?.balanceUsdt || 0 };
    }

    const result = await this.userModel.findOneAndUpdate(
      { wallet: wallet.toLowerCase(), balanceUsdt: { $gte: amount } },
      { $inc: { balanceUsdt: -amount } },
      { new: true },
    );

    if (!result) {
      return { success: false, newBalance: user.balanceUsdt };
    }

    return { success: true, newBalance: result.balanceUsdt };
  }

  /**
   * Set balance (admin only)
   */
  async setBalance(wallet: string, amount: number): Promise<number> {
    const result = await this.userModel.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { $set: { balanceUsdt: amount } },
      { new: true },
    );
    return result?.balanceUsdt || 0;
  }

  /**
   * Freeze user account
   */
  async freezeUser(wallet: string): Promise<void> {
    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $set: { isFrozen: true } },
    );
  }

  /**
   * Unfreeze user account
   */
  async unfreezeUser(wallet: string): Promise<void> {
    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $set: { isFrozen: false } },
    );
  }

  /**
   * Verify user
   */
  async verifyUser(wallet: string): Promise<void> {
    await this.userModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $set: { isVerified: true } },
    );
  }

  /**
   * Update streak
   */
  async updateStreak(wallet: string, won: boolean): Promise<void> {
    const user = await this.findByWallet(wallet);
    if (!user) return;

    if (won) {
      const newStreak = user.streakCurrent + 1;
      const bestStreak = Math.max(user.streakBest, newStreak);
      await this.userModel.updateOne(
        { wallet: wallet.toLowerCase() },
        { $set: { streakCurrent: newStreak, streakBest: bestStreak } },
      );
    } else {
      await this.userModel.updateOne(
        { wallet: wallet.toLowerCase() },
        { $set: { streakCurrent: 0 } },
      );
    }
  }

  /**
   * Adjust XP (admin)
   */
  async adjustXp(wallet: string, amount: number): Promise<number> {
    const result = await this.userModel.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { $inc: { xp: amount } },
      { new: true },
    );
    return result?.xp || 0;
  }
}
