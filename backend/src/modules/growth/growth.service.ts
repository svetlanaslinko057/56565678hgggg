import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserStreak, UserStreakDocument } from './streak.schema';
import { AnalystProfile, AnalystProfileDocument } from './analyst.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ArenaGateway } from '../realtime/realtime.gateway';
import { EVENTS } from '../../events/event-types';

// Streak badges
const STREAK_BADGES = [
  { streak: 3, badge: 'hot_start', name: 'Hot Start', xp: 10 },
  { streak: 5, badge: 'on_fire', name: 'On Fire', xp: 25 },
  { streak: 10, badge: 'hot_hand', name: 'Hot Hand', xp: 50 },
  { streak: 20, badge: 'oracle', name: 'Oracle', xp: 100 },
  { streak: 50, badge: 'market_killer', name: 'Market Killer', xp: 250 },
  { streak: 100, badge: 'alpha_seer', name: 'Alpha Seer', xp: 500 },
];

@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);

  constructor(
    @InjectModel(UserStreak.name)
    private streakModel: Model<UserStreakDocument>,
    @InjectModel(AnalystProfile.name)
    private analystModel: Model<AnalystProfileDocument>,
    private notificationsService: NotificationsService,
    private arenaGateway: ArenaGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== Streaks ====================

  /**
   * Get or create streak record
   */
  async getOrCreateStreak(wallet: string): Promise<UserStreakDocument> {
    const normalizedWallet = wallet.toLowerCase();
    
    let streak = await this.streakModel.findOne({ wallet: normalizedWallet });
    
    if (!streak) {
      streak = new this.streakModel({ wallet: normalizedWallet });
      await streak.save();
    }
    
    return streak;
  }

  /**
   * Handle position won
   */
  @OnEvent(EVENTS.POSITION_WON)
  async onPositionWon(payload: { wallet: string; profit: number }) {
    await this.recordWin(payload.wallet, payload.profit);
  }

  async recordWin(wallet: string, profit: number): Promise<{ newStreak: number; badge?: string }> {
    const streak = await this.getOrCreateStreak(wallet);
    
    streak.currentStreak += 1;
    streak.totalWins += 1;
    streak.totalPredictions += 1;
    streak.lastWinAt = new Date();
    
    // Check for new best streak
    if (streak.currentStreak > streak.bestStreak) {
      streak.bestStreak = streak.currentStreak;
    }
    
    // Check for badges
    let newBadge: string | undefined;
    for (const badgeInfo of STREAK_BADGES) {
      if (streak.currentStreak === badgeInfo.streak && !streak.badges.includes(badgeInfo.badge)) {
        streak.badges.push(badgeInfo.badge);
        newBadge = badgeInfo.badge;
        
        // Award XP
        this.eventEmitter.emit(EVENTS.XP_EARNED, {
          wallet,
          amount: badgeInfo.xp,
          reason: `streak_badge_${badgeInfo.badge}`,
        });
        
        // Notify user
        await this.notificationsService.create({
          userWallet: wallet,
          type: 'badge_earned' as any,
          title: `Badge Earned: ${badgeInfo.name}!`,
          message: `${streak.currentStreak} win streak! +${badgeInfo.xp} XP`,
          payload: { badge: badgeInfo.badge, streak: streak.currentStreak },
        });
        
        // WebSocket
        this.arenaGateway.notifyUser(wallet, {
          type: 'STREAK_BADGE',
          data: { badge: badgeInfo.badge, streak: streak.currentStreak },
        });
        
        this.logger.log(`Badge earned: ${wallet} got ${badgeInfo.badge} for ${streak.currentStreak} streak`);
      }
    }
    
    await streak.save();
    
    // Update analyst profile
    await this.updateAnalystStats(wallet);
    
    return { newStreak: streak.currentStreak, badge: newBadge };
  }

  /**
   * Handle position lost
   */
  @OnEvent(EVENTS.POSITION_LOST)
  async onPositionLost(payload: { wallet: string }) {
    await this.recordLoss(payload.wallet);
  }

  async recordLoss(wallet: string): Promise<void> {
    const streak = await this.getOrCreateStreak(wallet);
    
    // Only notify if streak was significant
    if (streak.currentStreak >= 3) {
      await this.notificationsService.create({
        userWallet: wallet,
        type: 'streak_broken' as any,
        title: 'Streak Broken',
        message: `Your ${streak.currentStreak} win streak has ended. Start a new one!`,
        payload: { brokenStreak: streak.currentStreak },
      });
    }
    
    streak.currentStreak = 0;
    streak.totalLosses += 1;
    streak.totalPredictions += 1;
    streak.lastLossAt = new Date();
    
    await streak.save();
    await this.updateAnalystStats(wallet);
  }

  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(limit: number = 20): Promise<UserStreak[]> {
    return this.streakModel
      .find({ currentStreak: { $gt: 0 } })
      .sort({ currentStreak: -1 })
      .limit(limit)
      .exec();
  }

  // ==================== Analyst Profiles ====================

  /**
   * Get or create analyst profile
   */
  async getOrCreateAnalyst(wallet: string): Promise<AnalystProfileDocument> {
    const normalizedWallet = wallet.toLowerCase();
    
    let analyst = await this.analystModel.findOne({ wallet: normalizedWallet });
    
    if (!analyst) {
      analyst = new this.analystModel({ wallet: normalizedWallet });
      await analyst.save();
    }
    
    return analyst;
  }

  /**
   * Get analyst profile
   */
  async getAnalystProfile(wallet: string): Promise<AnalystProfile | null> {
    return this.analystModel.findOne({ wallet: wallet.toLowerCase() });
  }

  /**
   * Update analyst stats (called after win/loss)
   */
  async updateAnalystStats(wallet: string): Promise<void> {
    const streak = await this.getOrCreateStreak(wallet);
    const analyst = await this.getOrCreateAnalyst(wallet);
    
    analyst.totalPredictions = streak.totalPredictions;
    analyst.winningPredictions = streak.totalWins;
    analyst.currentStreak = streak.currentStreak;
    analyst.bestStreak = streak.bestStreak;
    analyst.badges = streak.badges;
    
    // Calculate accuracy
    if (streak.totalPredictions > 0) {
      analyst.accuracy = Math.round((streak.totalWins / streak.totalPredictions) * 100);
    }
    
    await analyst.save();
  }

  /**
   * Update analyst profit/volume
   */
  async updateAnalystFinancials(wallet: string, profit: number, volume: number): Promise<void> {
    const analyst = await this.getOrCreateAnalyst(wallet);
    
    analyst.totalProfit += profit;
    analyst.totalVolume += volume;
    
    // Calculate ROI
    if (analyst.totalVolume > 0) {
      analyst.roi = Math.round((analyst.totalProfit / analyst.totalVolume) * 100);
    }
    
    await analyst.save();
  }

  /**
   * Follow analyst
   */
  async followAnalyst(followerWallet: string, targetWallet: string): Promise<void> {
    const follower = await this.getOrCreateAnalyst(followerWallet);
    const target = await this.getOrCreateAnalyst(targetWallet);
    
    const followerLower = followerWallet.toLowerCase();
    const targetLower = targetWallet.toLowerCase();
    
    if (!target.followers.includes(followerLower)) {
      target.followers.push(followerLower);
      target.followersCount = target.followers.length;
      await target.save();
      
      follower.following.push(targetLower);
      follower.followingCount = follower.following.length;
      await follower.save();
      
      // Notify target
      await this.notificationsService.create({
        userWallet: targetWallet,
        type: 'new_follower' as any,
        title: 'New Follower',
        message: `${followerWallet.slice(0, 8)}... started following you`,
        payload: { follower: followerWallet },
      });
    }
  }

  /**
   * Unfollow analyst
   */
  async unfollowAnalyst(followerWallet: string, targetWallet: string): Promise<void> {
    const follower = await this.getOrCreateAnalyst(followerWallet);
    const target = await this.getOrCreateAnalyst(targetWallet);
    
    const followerLower = followerWallet.toLowerCase();
    const targetLower = targetWallet.toLowerCase();
    
    target.followers = target.followers.filter(f => f !== followerLower);
    target.followersCount = target.followers.length;
    await target.save();
    
    follower.following = follower.following.filter(f => f !== targetLower);
    follower.followingCount = follower.following.length;
    await follower.save();
  }

  /**
   * Get top analysts
   */
  async getTopAnalysts(sortBy: 'roi' | 'accuracy' | 'followers' | 'volume' = 'roi', limit: number = 20): Promise<AnalystProfile[]> {
    const sortField: Record<string, any> = {
      roi: { roi: -1 as const },
      accuracy: { accuracy: -1 as const },
      followers: { followersCount: -1 as const },
      volume: { totalVolume: -1 as const },
    };
    
    return this.analystModel
      .find({ totalPredictions: { $gte: 5 } })
      .sort(sortField[sortBy])
      .limit(limit)
      .exec();
  }

  // ==================== Share Win ====================

  /**
   * Generate share card data
   */
  async generateShareCard(wallet: string, positionId: string): Promise<{
    wallet: string;
    profit: number;
    roi: number;
    streak: number;
    marketTitle: string;
    outcome: string;
    timestamp: Date;
    shareUrl: string;
  } | null> {
    // This would fetch position data and generate shareable info
    const analyst = await this.getAnalystProfile(wallet);
    const streak = await this.getOrCreateStreak(wallet);
    
    // Generate share URL with referral
    const shareUrl = `https://fomo.arena/ref/${wallet.slice(0, 10)}`;
    
    return {
      wallet,
      profit: analyst?.totalProfit || 0,
      roi: analyst?.roi || 0,
      streak: streak.currentStreak,
      marketTitle: 'Position', // Would be fetched from position
      outcome: 'YES',
      timestamp: new Date(),
      shareUrl,
    };
  }
}
