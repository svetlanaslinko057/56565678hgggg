import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { XpService } from '../xp/xp.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.schema';

/**
 * Economy Service
 * 
 * Connects blockchain events to economic rewards (XP, PnL, etc.)
 * All rewards are event-driven:
 * - BetPlaced → +10 XP
 * - Win → +50 XP  
 * - Claim → +20 XP + PnL
 * - Streak → bonus XP
 */
@Injectable()
export class EconomyService {
  private readonly logger = new Logger(EconomyService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private xpService: XpService,
    private notificationsService: NotificationsService,
  ) {}

  private get positionsCollection() {
    return this.connection.collection('positions_mirror');
  }

  private get activitiesCollection() {
    return this.connection.collection('activities');
  }

  private get userStatsCollection() {
    return this.connection.collection('user_stats');
  }

  /**
   * Handle BetPlaced event
   * Award XP for placing a bet
   */
  async onBetPlaced(params: {
    wallet: string;
    marketId: number;
    tokenId: number;
    amount: string;
    outcome: number;
    txHash: string;
  }) {
    const { wallet, marketId, tokenId, amount, outcome, txHash } = params;
    const userWallet = wallet.toLowerCase();

    this.logger.log(`[Economy] BetPlaced: ${userWallet} bet on market ${marketId}`);

    try {
      // Award XP
      const xpResult = await this.xpService.onBetPlaced(userWallet);

      // Send notification
      await this.notificationsService.create({
        userWallet,
        type: NotificationType.BET_PLACED,
        title: 'Bet Placed',
        message: `You placed a $${(parseFloat(amount) / 1e18).toFixed(2)} bet on market #${marketId}`,
        payload: {
          marketId: String(marketId),
          stake: parseFloat(amount) / 1e18,
          outcome: String(outcome),
          xpAmount: xpResult.xp,
        },
      });

      this.logger.log(`[Economy] Awarded ${xpResult.xp} XP to ${userWallet}`);

      return { xp: xpResult.xp, badges: xpResult.badges };
    } catch (err) {
      this.logger.error(`[Economy] Failed to process BetPlaced: ${err}`);
      return null;
    }
  }

  /**
   * Handle position won (after market resolution)
   * Award XP for winning
   */
  async onPositionWon(params: {
    wallet: string;
    marketId: number;
    tokenId: number;
    amount: string;
    payout: string;
    question?: string;
    txHash: string;
  }) {
    const { wallet, marketId, tokenId, amount, payout, question, txHash } = params;
    const userWallet = wallet.toLowerCase();

    const stakeNum = parseFloat(amount) / 1e18;
    const payoutNum = parseFloat(payout) / 1e18;
    const pnl = payoutNum - stakeNum;

    this.logger.log(`[Economy] PositionWon: ${userWallet} won $${payoutNum} on market ${marketId}`);

    try {
      // Award XP with PnL
      const xpResult = await this.xpService.onWin(userWallet, pnl);

      // Send notification
      await this.notificationsService.create({
        userWallet,
        type: NotificationType.POSITION_WON,
        title: 'You Won!',
        message: `Congratulations! You won $${payoutNum.toFixed(2)} on "${question || `Market #${marketId}`}"`,
        payload: {
          marketId: String(marketId),
          winnings: payoutNum,
          xpAmount: xpResult.xp,
        },
      });

      // Check for level up notification
      if (xpResult.levelUp) {
        await this.notificationsService.create({
          userWallet,
          type: NotificationType.LEVEL_UP,
          title: 'Level Up!',
          message: `You've reached a new level! Keep winning!`,
          payload: { newLevel: xpResult.levelUp },
        });
      }

      this.logger.log(`[Economy] Awarded ${xpResult.xp} XP to ${userWallet} (streak: ${xpResult.streak})`);

      return { xp: xpResult.xp, badges: xpResult.badges, streak: xpResult.streak };
    } catch (err) {
      this.logger.error(`[Economy] Failed to process PositionWon: ${err}`);
      return null;
    }
  }

  /**
   * Handle position lost (after market resolution)
   */
  async onPositionLost(params: {
    wallet: string;
    marketId: number;
    tokenId: number;
    amount: string;
    question?: string;
    txHash: string;
  }) {
    const { wallet, marketId, tokenId, amount, question, txHash } = params;
    const userWallet = wallet.toLowerCase();

    this.logger.log(`[Economy] PositionLost: ${userWallet} lost on market ${marketId}`);

    try {
      // Award small consolation XP, reset streak
      const xpResult = await this.xpService.onLoss(userWallet);

      // Send notification
      await this.notificationsService.create({
        userWallet,
        type: NotificationType.POSITION_LOST,
        title: 'Better Luck Next Time',
        message: `Your bet on "${question || `Market #${marketId}`}" didn't win this time.`,
        payload: {
          marketId: String(marketId),
          stake: parseFloat(amount) / 1e18,
          xpAmount: xpResult.xp,
        },
      });

      return { xp: xpResult.xp };
    } catch (err) {
      this.logger.error(`[Economy] Failed to process PositionLost: ${err}`);
      return null;
    }
  }

  /**
   * Handle PositionClaimed event
   * Award XP and finalize PnL
   */
  async onPositionClaimed(params: {
    wallet: string;
    tokenId: number;
    netAmount: string;
    feeAmount: string;
    txHash: string;
  }) {
    const { wallet, tokenId, netAmount, feeAmount, txHash } = params;
    const userWallet = wallet.toLowerCase();

    const claimedAmount = parseFloat(netAmount) / 1e18;

    this.logger.log(`[Economy] PositionClaimed: ${userWallet} claimed $${claimedAmount} (token #${tokenId})`);

    try {
      // Award XP for claiming
      const xpResult = await this.xpService.onClaim(userWallet);

      // Get position details for notification
      const position = await this.positionsCollection.findOne({ tokenId });

      // Send notification
      await this.notificationsService.create({
        userWallet,
        type: NotificationType.POSITION_CLAIMED,
        title: 'Claimed Successfully!',
        message: `You claimed $${claimedAmount.toFixed(2)} to your wallet`,
        payload: {
          marketId: position?.marketId ? String(position.marketId) : undefined,
          winnings: claimedAmount,
          xpAmount: xpResult.xp,
        },
      });

      this.logger.log(`[Economy] Awarded ${xpResult.xp} XP to ${userWallet} for claim`);

      return { xp: xpResult.xp, claimedAmount };
    } catch (err) {
      this.logger.error(`[Economy] Failed to process PositionClaimed: ${err}`);
      return null;
    }
  }

  /**
   * Get leaderboard from real positions_mirror data
   */
  async getLeaderboard(limit: number = 20) {
    try {
      // Aggregate real PnL and wins from positions_mirror
      const pipeline = [
        {
          $match: {
            status: { $in: ['won', 'claimed'] },
          },
        },
        {
          $group: {
            _id: '$owner',
            totalWins: { $sum: 1 },
            totalStaked: { $sum: { $toDouble: '$amount' } },
          },
        },
        {
          $sort: { totalWins: -1 },
        },
        {
          $limit: limit,
        },
      ];

      const positionStats = await this.positionsCollection.aggregate(pipeline).toArray();

      // Enrich with XP data
      const leaderboard = [];

      for (let i = 0; i < positionStats.length; i++) {
        const stat = positionStats[i];
        const wallet = stat._id;

        // Get XP stats
        const userStats = await this.userStatsCollection.findOne({ wallet });

        leaderboard.push({
          rank: i + 1,
          wallet,
          totalWins: stat.totalWins,
          totalStaked: (stat.totalStaked / 1e18).toFixed(2),
          xp: userStats?.xp || 0,
          level: userStats?.level || 1,
          badges: userStats?.badges || [],
          currentStreak: userStats?.currentStreak || 0,
          bestStreak: userStats?.bestStreak || 0,
        });
      }

      return leaderboard;
    } catch (err) {
      this.logger.error(`[Economy] Failed to get leaderboard: ${err}`);

      // Fallback to XP-based leaderboard
      return this.xpService.getLeaderboard(limit);
    }
  }

  /**
   * Get user economy stats (real data from positions_mirror + XP)
   */
  async getUserEconomyStats(wallet: string) {
    const userWallet = wallet.toLowerCase();

    try {
      // Get XP stats
      const xpStats = await this.xpService.getUserStats(userWallet);

      // Get real position stats from mirror
      const positions = await this.positionsCollection.find({ owner: userWallet }).toArray();

      const totalBets = positions.length;
      const wonPositions = positions.filter(p => p.status === 'won' || p.status === 'claimed');
      const lostPositions = positions.filter(p => p.status === 'lost');
      const claimedPositions = positions.filter(p => p.status === 'claimed');

      // Calculate real PnL
      let totalStaked = 0;
      let totalClaimedAmount = 0;

      for (const pos of positions) {
        totalStaked += parseFloat(pos.amount) / 1e18;
      }

      // Get claimed amounts from activities
      const claimActivities = await this.activitiesCollection.find({
        user: userWallet,
        type: NotificationType.POSITION_CLAIMED,
      }).toArray();

      for (const activity of claimActivities) {
        if (activity.data?.netAmount) {
          totalClaimedAmount += parseFloat(activity.data.netAmount) / 1e18;
        } else if (activity.amount) {
          totalClaimedAmount += parseFloat(activity.amount) / 1e18;
        }
      }

      const realPnl = totalClaimedAmount - totalStaked;
      const winRate = totalBets > 0 ? (wonPositions.length / totalBets * 100).toFixed(1) : '0';

      return {
        ...xpStats,
        // Real stats from on-chain data
        realStats: {
          totalBets,
          totalWins: wonPositions.length,
          totalLosses: lostPositions.length,
          totalClaimed: claimedPositions.length,
          totalStaked: totalStaked.toFixed(2),
          totalClaimedAmount: totalClaimedAmount.toFixed(2),
          realPnl: realPnl.toFixed(2),
          winRate: `${winRate}%`,
        },
      };
    } catch (err) {
      this.logger.error(`[Economy] Failed to get user economy stats: ${err}`);
      return await this.xpService.getUserStats(userWallet);
    }
  }
}
