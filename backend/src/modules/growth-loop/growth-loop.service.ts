import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

interface WeeklyStats {
  wallet: string;
  username: string;
  avatar: string;
  profit: number;
  roi: number;
  wins: number;
  totalBets: number;
  rank: number;
}

interface RivalPressure {
  rivalWallet: string;
  rivalName: string;
  yourWins: number;
  rivalWins: number;
  streak: number;
  streakHolder: 'you' | 'rival';
  lastLoss: Date | null;
}

/**
 * Growth Loop Service - REAL DATA VERSION
 * 
 * Connects to MongoDB collections:
 * - positions: for weekly PnL tracking
 * - rivalries: for rival pressure
 * - users/analysts: for user data
 */
@Injectable()
export class GrowthLoopService {
  private readonly logger = new Logger(GrowthLoopService.name);
  
  // Weekly rewards
  private readonly WEEKLY_REWARDS = [
    { rank: 1, reward: 50, xp: 500 },
    { rank: 2, reward: 25, xp: 300 },
    { rank: 3, reward: 10, xp: 200 },
    { rank: 4, reward: 0, xp: 100 },
    { rank: 5, reward: 0, xp: 80 },
    { rank: 6, reward: 0, xp: 60 },
    { rank: 7, reward: 0, xp: 50 },
    { rank: 8, reward: 0, xp: 40 },
    { rank: 9, reward: 0, xp: 30 },
    { rank: 10, reward: 0, xp: 25 },
  ];

  constructor(
    @InjectConnection() private connection: Connection,
    private eventEmitter: EventEmitter2,
  ) {
    this.logger.log('Growth Loop Service initialized with REAL DATA');
  }

  private get positionsCollection() {
    return this.connection.collection('positions');
  }

  private get rivalriesCollection() {
    return this.connection.collection('rivalries');
  }

  private get usersCollection() {
    return this.connection.collection('users');
  }

  private get userStatsCollection() {
    return this.connection.collection('user_stats');
  }

  /**
   * Get weekly competition data - REAL DATA
   */
  async getWeeklyCompetition(wallet: string): Promise<{
    endsIn: number;
    yourRank: number;
    yourProfit: number;
    yourPotentialReward: number;
    topUsers: WeeklyStats[];
    nextRankProfit: number | null;
    isInTop10: boolean;
  }> {
    const normalizedWallet = wallet.toLowerCase();
    
    // Calculate time until Sunday midnight UTC
    const now = new Date();
    const sunday = new Date(now);
    sunday.setUTCDate(sunday.getUTCDate() + (7 - sunday.getUTCDay()));
    sunday.setUTCHours(23, 59, 59, 999);
    const endsIn = Math.max(0, sunday.getTime() - now.getTime());

    // Get start of week
    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);

    // Aggregate weekly profits from positions
    const pipeline = [
      {
        $match: {
          status: { $in: ['won', 'lost', 'claimed'] },
          resolvedAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: '$wallet',
          profit: { $sum: '$profit' },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $in: ['$status', ['won', 'claimed']] }, 1, 0] } },
          totalStaked: { $sum: '$amount' },
        },
      },
      {
        $match: { profit: { $gt: 0 } }, // Only profitable users
      },
      { $sort: { profit: -1 } },
      { $limit: 100 },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();

    // Build top users list with enriched data
    const topUsers: WeeklyStats[] = [];
    
    for (let i = 0; i < Math.min(results.length, 10); i++) {
      const result = results[i];
      const userInfo = await this.getUserInfo(result._id);
      const roi = result.totalStaked > 0 
        ? (result.profit / result.totalStaked) * 100 
        : 0;
      
      topUsers.push({
        wallet: result._id,
        username: userInfo?.username || this.formatWallet(result._id),
        avatar: userInfo?.avatar || '',
        profit: Math.round(result.profit * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        wins: result.wins,
        totalBets: result.totalBets,
        rank: i + 1,
      });
    }

    // Find user's position
    let yourRank = 0;
    let yourProfit = 0;
    
    const userIndex = results.findIndex(r => r._id === normalizedWallet);
    if (userIndex >= 0) {
      yourRank = userIndex + 1;
      yourProfit = Math.round(results[userIndex].profit * 100) / 100;
    } else {
      // User not in top 100, check their actual profit
      const userStats = await this.getUserWeeklyStats(normalizedWallet, weekStart);
      yourProfit = userStats?.profit || 0;
      yourRank = results.length + 1; // Simplified - beyond top 100
    }

    // Calculate potential reward
    const rewardInfo = this.WEEKLY_REWARDS.find(r => r.rank === yourRank) || { reward: 0, xp: 20 };
    
    // Calculate profit needed for next rank
    let nextRankProfit: number | null = null;
    if (yourRank > 1 && yourRank <= results.length) {
      nextRankProfit = results[yourRank - 2]?.profit || null;
    } else if (yourRank > results.length && results.length > 0) {
      nextRankProfit = results[results.length - 1]?.profit || 0;
    }

    return {
      endsIn,
      yourRank,
      yourProfit,
      yourPotentialReward: rewardInfo.reward,
      topUsers,
      nextRankProfit: nextRankProfit !== null ? Math.round(nextRankProfit * 100) / 100 : null,
      isInTop10: yourRank <= 10 && yourRank > 0,
    };
  }

  /**
   * Get user's weekly stats
   */
  private async getUserWeeklyStats(wallet: string, weekStart: Date) {
    const pipeline = [
      {
        $match: {
          wallet,
          status: { $in: ['won', 'lost', 'claimed'] },
          resolvedAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          profit: { $sum: '$profit' },
          totalBets: { $sum: 1 },
        },
      },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();
    return results[0] || null;
  }

  /**
   * Get rival pressure data - REAL DATA
   */
  async getRivalPressure(wallet: string): Promise<RivalPressure[]> {
    const normalizedWallet = wallet.toLowerCase();

    // Query rivalries collection
    const rivalries = await this.rivalriesCollection.find({
      $or: [
        { walletA: normalizedWallet },
        { walletB: normalizedWallet },
      ],
    }).sort({ totalDuels: -1 }).limit(10).toArray();

    const result: RivalPressure[] = [];

    for (const rivalry of rivalries) {
      const isA = rivalry.walletA === normalizedWallet;
      const rivalWallet = isA ? rivalry.walletB : rivalry.walletA;
      const yourWins = isA ? rivalry.winsA : rivalry.winsB;
      const rivalWins = isA ? rivalry.winsB : rivalry.winsA;

      // Determine streak holder
      let streakHolder: 'you' | 'rival' = 'you';
      let streak = 0;
      
      if (rivalry.currentStreakWallet === normalizedWallet) {
        streakHolder = 'you';
        streak = rivalry.currentStreakCount || 0;
      } else if (rivalry.currentStreakWallet === rivalWallet) {
        streakHolder = 'rival';
        streak = rivalry.currentStreakCount || 0;
      }

      const rivalInfo = await this.getUserInfo(rivalWallet);

      result.push({
        rivalWallet,
        rivalName: rivalInfo?.username || this.formatWallet(rivalWallet),
        yourWins,
        rivalWins,
        streak,
        streakHolder,
        lastLoss: streakHolder === 'rival' ? rivalry.lastDuelAt : null,
      });
    }

    // Sort by most pressing (losing streaks first, then most duels)
    return result.sort((a, b) => {
      // Priority: losing streaks
      if (a.streakHolder === 'rival' && b.streakHolder !== 'rival') return -1;
      if (b.streakHolder === 'rival' && a.streakHolder !== 'rival') return 1;
      // Then by streak count
      if (a.streakHolder === 'rival' && b.streakHolder === 'rival') {
        return b.streak - a.streak;
      }
      // Then by total activity
      return (b.yourWins + b.rivalWins) - (a.yourWins + a.rivalWins);
    });
  }

  /**
   * Get user info from users/analysts collections
   */
  private async getUserInfo(wallet: string): Promise<{ username: string; avatar: string } | null> {
    try {
      const user = await this.usersCollection.findOne({ wallet: wallet.toLowerCase() });
      if (user) {
        return {
          username: user.username || user.name || this.formatWallet(wallet),
          avatar: user.avatar || '',
        };
      }

      // Check user_stats/analysts
      const analyst = await this.userStatsCollection.findOne({ wallet: wallet.toLowerCase() });
      if (analyst) {
        return {
          username: analyst.username || this.formatWallet(wallet),
          avatar: '',
        };
      }
    } catch (e) {
      this.logger.error(`Error fetching user info: ${e}`);
    }
    return null;
  }

  /**
   * Format wallet address
   */
  private formatWallet(wallet: string): string {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  }

  /**
   * Generate Telegram deep link
   */
  generateTelegramDeepLink(params: {
    type: 'market' | 'rival' | 'win' | 'leaderboard' | 'referral';
    marketId?: string;
    rivalWallet?: string;
    shareId?: string;
    refWallet?: string;
  }): string {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FOMOArenaBot';
    const baseUrl = `https://t.me/${botUsername}`;
    
    let startParam = '';
    
    switch (params.type) {
      case 'market':
        startParam = `market_${params.marketId}`;
        break;
      case 'rival':
        startParam = `rival_${params.rivalWallet?.slice(2, 10)}`;
        break;
      case 'win':
        startParam = `win_${params.shareId}`;
        break;
      case 'leaderboard':
        startParam = 'leaderboard';
        break;
      case 'referral':
        startParam = `ref_${params.refWallet?.slice(2, 10)}`;
        break;
    }

    return `${baseUrl}?startapp=${startParam}`;
  }

  /**
   * Generate enhanced win card data - REAL DATA
   */
  async generateWinCardData(params: {
    wallet: string;
    positionId: string;
    profit: number;
    stake: number;
  }): Promise<{
    profit: number;
    roi: number;
    badges: string[];
    achievements: string[];
    streak: number;
    rivalBeaten: string | null;
    leaderboardPosition: number | null;
    shareMessage: string;
    deepLink: string;
  }> {
    const normalizedWallet = params.wallet.toLowerCase();
    // ROI = (profit / stake) * 100, where profit is already net (winnings - stake)
    const roi = params.stake > 0 ? (params.profit / params.stake) * 100 : 0;
    
    const badges: string[] = [];
    const achievements: string[] = [];
    
    // Check ROI badges
    if (roi >= 100) badges.push('2x_winner');
    if (roi >= 200) badges.push('3x_winner');
    if (params.profit >= 100) badges.push('centurion');
    if (params.profit >= 500) badges.push('whale_win');
    
    // Get user's current streak from user_stats
    let streak = 0;
    const userStats = await this.userStatsCollection.findOne({ wallet: normalizedWallet });
    if (userStats?.currentStreak) {
      streak = userStats.currentStreak;
      if (streak >= 3) {
        badges.push('hot_streak');
        achievements.push(`${streak} win streak!`);
      }
    }
    
    // Check if rival was beaten in recent duel
    let rivalBeaten: string | null = null;
    const recentDuel = await this.connection.collection('duels').findOne({
      winnerWallet: normalizedWallet,
      status: 'finished',
    }, { sort: { finishedAt: -1 } });
    
    if (recentDuel) {
      const loserWallet = recentDuel.creatorWallet === normalizedWallet 
        ? recentDuel.opponentWallet 
        : recentDuel.creatorWallet;
      const loserInfo = await this.getUserInfo(loserWallet);
      rivalBeaten = loserInfo?.username || this.formatWallet(loserWallet);
      achievements.push(`Beat rival ${rivalBeaten}`);
    }
    
    // Check leaderboard position
    let leaderboardPosition: number | null = null;
    const weeklyData = await this.getWeeklyCompetition(normalizedWallet);
    if (weeklyData.yourRank <= 10 && weeklyData.yourRank > 0) {
      leaderboardPosition = weeklyData.yourRank;
      achievements.push(`Top ${leaderboardPosition} this week`);
    }

    // Generate share message
    const shareMessage = this.generateShareMessage(params.profit, achievements);
    
    // Generate deep link
    const deepLink = this.generateTelegramDeepLink({
      type: 'referral',
      refWallet: params.wallet,
    });

    return {
      profit: params.profit,
      roi: Math.round(roi * 10) / 10,
      badges,
      achievements,
      streak,
      rivalBeaten,
      leaderboardPosition,
      shareMessage,
      deepLink,
    };
  }

  /**
   * Generate viral share message
   */
  private generateShareMessage(profit: number, achievements: string[]): string {
    let message = `🎉 +$${profit.toFixed(0)} on FOMO Arena!\n\n`;
    
    if (achievements.length > 0) {
      message += achievements.map(a => `🔥 ${a}`).join('\n');
      message += '\n\n';
    }
    
    message += '💰 Predict. Bet. Win.\n';
    message += '👉 Join the arena:';
    
    return message;
  }

  /**
   * Send FOMO push notification via Telegram
   */
  async sendFomoPush(params: {
    type: 'edge_jump' | 'whale_bet' | 'closing_soon' | 'rival_ahead';
    telegramId: string;
    marketId?: string;
    marketTitle?: string;
    data: any;
  }): Promise<void> {
    let message = '';
    let deepLink = '';

    switch (params.type) {
      case 'edge_jump':
        message = `⚡ *Edge jumped to +${params.data.edge}%*\n\n${params.marketTitle}\n\nAI: ${params.data.signal}`;
        deepLink = this.generateTelegramDeepLink({ type: 'market', marketId: params.marketId });
        break;
        
      case 'whale_bet':
        message = `🐋 *$${params.data.amount} bet ${params.data.side}*\n\n${params.marketTitle}\n\nFollow the whale?`;
        deepLink = this.generateTelegramDeepLink({ type: 'market', marketId: params.marketId });
        break;
        
      case 'closing_soon':
        message = `⏰ *Closing in ${params.data.minutes}m*\n\n${params.marketTitle}\n\n🔥 ${params.data.recentBets} bets last 5 min`;
        deepLink = this.generateTelegramDeepLink({ type: 'market', marketId: params.marketId });
        break;
        
      case 'rival_ahead':
        message = `⚔️ *${params.data.rivalName} is ${params.data.streak} wins ahead!*\n\nTime for revenge?`;
        deepLink = this.generateTelegramDeepLink({ type: 'rival', rivalWallet: params.data.rivalWallet });
        break;
    }

    this.eventEmitter.emit('telegram.push', {
      telegramId: params.telegramId,
      message,
      deepLink,
    });

    this.logger.log(`FOMO push sent: ${params.type} to ${params.telegramId}`);
  }

  /**
   * Send rival pressure notification
   */
  async sendRivalPressureNotification(wallet: string, rivalData: RivalPressure): Promise<void> {
    // Find user's telegram ID
    const user = await this.usersCollection.findOne({ wallet: wallet.toLowerCase() });
    if (!user?.telegramId) {
      this.logger.warn(`No telegram ID for wallet ${wallet}`);
      return;
    }

    await this.sendFomoPush({
      type: 'rival_ahead',
      telegramId: user.telegramId,
      data: {
        rivalName: rivalData.rivalName,
        rivalWallet: rivalData.rivalWallet,
        streak: rivalData.streak,
      },
    });
  }

  /**
   * Send weekly pressure notification
   */
  async sendWeeklyPressureNotification(wallet: string, rank: number, hoursLeft: number): Promise<void> {
    const user = await this.usersCollection.findOne({ wallet: wallet.toLowerCase() });
    if (!user?.telegramId) return;

    const deepLink = this.generateTelegramDeepLink({ type: 'leaderboard' });
    
    let message = '';
    if (rank <= 10) {
      message = `🏆 *Weekly Competition*\n\nYou're #${rank} with ${hoursLeft}h left!\n\nOne more win to climb higher.`;
    } else if (rank <= 20) {
      message = `🏆 *Weekly Competition*\n\nYou're #${rank} - just ${rank - 10} spots from Top 10!\n\n${hoursLeft}h remaining.`;
    } else {
      message = `🏆 *Weekly ends in ${hoursLeft}h*\n\nMake your mark on the leaderboard!`;
    }

    this.eventEmitter.emit('telegram.push', {
      telegramId: user.telegramId,
      message,
      deepLink,
    });
  }

  /**
   * Cron: Check and send pressure notifications
   */
  @Cron('0 */4 * * *') // Every 4 hours
  async checkAndSendPressureNotifications(): Promise<void> {
    this.logger.log('Checking pressure notifications...');
    
    // Get users with rivals who are losing
    const rivalries = await this.rivalriesCollection.find({
      currentStreakCount: { $gte: 3 },
    }).toArray();

    for (const rivalry of rivalries) {
      // Find the losing party
      const loserWallet = rivalry.currentStreakWallet === rivalry.walletA 
        ? rivalry.walletB 
        : rivalry.walletA;
      
      const winnerInfo = await this.getUserInfo(rivalry.currentStreakWallet);
      
      await this.sendRivalPressureNotification(loserWallet, {
        rivalWallet: rivalry.currentStreakWallet,
        rivalName: winnerInfo?.username || this.formatWallet(rivalry.currentStreakWallet),
        yourWins: rivalry.currentStreakWallet === rivalry.walletA ? rivalry.winsB : rivalry.winsA,
        rivalWins: rivalry.currentStreakWallet === rivalry.walletA ? rivalry.winsA : rivalry.winsB,
        streak: rivalry.currentStreakCount,
        streakHolder: 'rival',
        lastLoss: rivalry.lastDuelAt,
      });
    }
  }

  /**
   * Cron: Send Friday/Sunday weekly pressure
   */
  @Cron('0 12 * * 5') // Friday 12:00 UTC
  async sendFridayPressure(): Promise<void> {
    this.logger.log('Sending Friday weekly pressure notifications');
    // Get users in positions 11-30 who could make top 10
    const weeklyData = await this.getWeeklyCompetition('');
    // Implementation: loop through users and send notifications
  }

  @Cron('0 12 * * 0') // Sunday 12:00 UTC  
  async sendSundayUrgency(): Promise<void> {
    this.logger.log('Sending Sunday urgency notifications');
    // Get users close to ranking thresholds
  }
}
