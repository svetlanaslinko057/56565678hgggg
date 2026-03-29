import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { XP_REWARDS, BADGES } from './user-stats.schema';

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);
  
  constructor(
    @InjectConnection() private connection: Connection,
  ) {}
  
  private get collection() {
    return this.connection.collection('user_stats');
  }
  
  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }
  
  /**
   * XP needed for next level
   */
  xpForLevel(level: number): number {
    return (level - 1) * (level - 1) * 100;
  }
  
  /**
   * Get or create user stats
   */
  async getOrCreateStats(wallet: string): Promise<any> {
    const userWallet = wallet.toLowerCase();
    
    let stats = await this.collection.findOne({ wallet: userWallet });
    
    if (!stats) {
      const newStats = {
        wallet: userWallet,
        xp: 0,
        level: 1,
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalPnl: 0,
        badges: [] as string[],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await this.collection.insertOne(newStats);
      return { ...newStats, _id: result.insertedId };
    }
    
    return stats;
  }
  
  /**
   * Add XP and check for level up
   */
  async addXp(wallet: string, amount: number, reason: string): Promise<{
    xpAdded: number;
    newXp: number;
    newLevel: number;
    leveledUp: boolean;
    newBadges: string[];
  }> {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const oldLevel = stats.level || 1;
    const newXp = (stats.xp || 0) + amount;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;
    
    await this.collection.updateOne(
      { wallet: userWallet },
      { 
        $inc: { xp: amount },
        $set: { level: newLevel, updatedAt: new Date() }
      }
    );
    
    this.logger.log(`XP Added: ${userWallet} +${amount} XP (${reason}) → Level ${newLevel}`);
    
    return {
      xpAdded: amount,
      newXp,
      newLevel,
      leveledUp,
      newBadges: [],
    };
  }
  
  /**
   * Process bet placed event
   */
  async onBetPlaced(wallet: string): Promise<{
    xp: number;
    badges: string[];
    levelUp: boolean;
  }> {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const newTotalBets = (stats.totalBets || 0) + 1;
    const newBadges: string[] = [];
    let totalXp = XP_REWARDS.BET_PLACED;
    
    // Check for first bet badge
    if (newTotalBets === 1 && !stats.badges?.includes(BADGES.FIRST_BET.id)) {
      newBadges.push(BADGES.FIRST_BET.id);
    }
    
    // Check for bet milestones
    if (newTotalBets === 10 && !stats.badges?.includes(BADGES.BETS_10.id)) {
      newBadges.push(BADGES.BETS_10.id);
    }
    if (newTotalBets === 50 && !stats.badges?.includes(BADGES.BETS_50.id)) {
      newBadges.push(BADGES.BETS_50.id);
    }
    if (newTotalBets === 100 && !stats.badges?.includes(BADGES.BETS_100.id)) {
      newBadges.push(BADGES.BETS_100.id);
    }
    
    const newXp = (stats.xp || 0) + totalXp;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > (stats.level || 1);
    
    await this.collection.updateOne(
      { wallet: userWallet },
      {
        $inc: { xp: totalXp, totalBets: 1 },
        $set: { level: newLevel, updatedAt: new Date() },
        $addToSet: { badges: { $each: newBadges } },
      }
    );
    
    this.logger.log(`Bet Placed: ${userWallet} +${totalXp} XP, badges: ${newBadges.join(', ')}`);
    
    return { xp: totalXp, badges: newBadges, levelUp: leveledUp };
  }
  
  /**
   * Process win event
   */
  async onWin(wallet: string, pnlAmount: number = 0): Promise<{
    xp: number;
    badges: string[];
    levelUp: boolean;
    streak: number;
  }> {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const newWins = (stats.totalWins || 0) + 1;
    const newStreak = (stats.currentStreak || 0) + 1;
    const newBestStreak = Math.max(newStreak, stats.bestStreak || 0);
    const newPnl = (stats.totalPnl || 0) + pnlAmount;
    const newBadges: string[] = [];
    let totalXp = XP_REWARDS.WIN;
    
    // First win badge
    if (newWins === 1 && !stats.badges?.includes(BADGES.FIRST_WIN.id)) {
      newBadges.push(BADGES.FIRST_WIN.id);
    }
    
    // Streak badges + bonus XP
    if (newStreak === 3) {
      totalXp += XP_REWARDS.STREAK_3;
      if (!stats.badges?.includes(BADGES.STREAK_3.id)) {
        newBadges.push(BADGES.STREAK_3.id);
      }
    }
    if (newStreak === 5) {
      totalXp += XP_REWARDS.STREAK_5;
      if (!stats.badges?.includes(BADGES.STREAK_5.id)) {
        newBadges.push(BADGES.STREAK_5.id);
      }
    }
    if (newStreak === 10) {
      totalXp += XP_REWARDS.STREAK_10;
      if (!stats.badges?.includes(BADGES.STREAK_10.id)) {
        newBadges.push(BADGES.STREAK_10.id);
      }
    }
    
    // Profit badges
    if (newPnl >= 100 && (stats.totalPnl || 0) < 100 && !stats.badges?.includes(BADGES.PROFIT_100.id)) {
      newBadges.push(BADGES.PROFIT_100.id);
    }
    if (newPnl >= 1000 && (stats.totalPnl || 0) < 1000 && !stats.badges?.includes(BADGES.PROFIT_1000.id)) {
      newBadges.push(BADGES.PROFIT_1000.id);
    }
    
    const newXp = (stats.xp || 0) + totalXp;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > (stats.level || 1);
    
    await this.collection.updateOne(
      { wallet: userWallet },
      {
        $inc: { xp: totalXp, totalWins: 1 },
        $set: { 
          level: newLevel, 
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalPnl: newPnl,
          updatedAt: new Date() 
        },
        $addToSet: { badges: { $each: newBadges } },
      }
    );
    
    this.logger.log(`Win: ${userWallet} +${totalXp} XP, streak: ${newStreak}, badges: ${newBadges.join(', ')}`);
    
    return { xp: totalXp, badges: newBadges, levelUp: leveledUp, streak: newStreak };
  }
  
  /**
   * Process loss event
   */
  async onLoss(wallet: string): Promise<{
    xp: number;
    badges: string[];
    levelUp: boolean;
  }> {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const totalXp = XP_REWARDS.LOSS; // Small consolation XP
    
    const newXp = (stats.xp || 0) + totalXp;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > (stats.level || 1);
    
    await this.collection.updateOne(
      { wallet: userWallet },
      {
        $inc: { xp: totalXp, totalLosses: 1 },
        $set: { 
          level: newLevel,
          currentStreak: 0, // Reset streak
          updatedAt: new Date() 
        },
      }
    );
    
    this.logger.log(`Loss: ${userWallet} +${totalXp} XP, streak reset`);
    
    return { xp: totalXp, badges: [], levelUp: leveledUp };
  }
  
  /**
   * Process claim event
   */
  async onClaim(wallet: string): Promise<{
    xp: number;
    badges: string[];
    levelUp: boolean;
  }> {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const totalXp = XP_REWARDS.CLAIM;
    
    const newXp = (stats.xp || 0) + totalXp;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > (stats.level || 1);
    
    await this.collection.updateOne(
      { wallet: userWallet },
      {
        $inc: { xp: totalXp },
        $set: { level: newLevel, updatedAt: new Date() },
      }
    );
    
    this.logger.log(`Claim: ${userWallet} +${totalXp} XP`);
    
    return { xp: totalXp, badges: [], levelUp: leveledUp };
  }
  
  /**
   * Get user stats with level progress
   */
  async getUserStats(wallet: string) {
    const userWallet = wallet.toLowerCase();
    const stats = await this.getOrCreateStats(userWallet);
    
    const level = stats.level || 1;
    const xp = stats.xp || 0;
    const currentLevelXp = this.xpForLevel(level);
    const nextLevelXp = this.xpForLevel(level + 1);
    const progress = nextLevelXp > currentLevelXp 
      ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
      : 100;
    
    return {
      wallet: userWallet,
      xp,
      level,
      xpProgress: {
        current: xp - currentLevelXp,
        needed: nextLevelXp - currentLevelXp,
        percentage: Math.min(100, Math.max(0, progress)),
      },
      totalBets: stats.totalBets || 0,
      totalWins: stats.totalWins || 0,
      totalLosses: stats.totalLosses || 0,
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      totalPnl: stats.totalPnl || 0,
      badges: stats.badges || [],
      badgeDetails: (stats.badges || []).map((id: string) => {
        const badge = Object.values(BADGES).find(b => b.id === id);
        return badge || { id, name: id, emoji: '🏅', description: '' };
      }),
    };
  }
  
  /**
   * Get XP leaderboard
   */
  async getLeaderboard(limit: number = 20) {
    const users = await this.collection
      .find({})
      .sort({ xp: -1 })
      .limit(limit)
      .toArray();
    
    return users.map((user, index) => ({
      rank: index + 1,
      wallet: user.wallet,
      xp: user.xp || 0,
      level: user.level || 1,
      totalWins: user.totalWins || 0,
      bestStreak: user.bestStreak || 0,
      badges: user.badges || [],
    }));
  }
}
