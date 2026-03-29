import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  username?: string;
  pnl: number;
  winrate: number;
  totalBets: number;
  wins: number;
  losses: number;
  duelWins: number;
  duelLosses: number;
  xp: number;
  level: number;
  streak: number;
  badges?: string[];
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
  total: number;
  period: string;
  sortBy: string;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  private get usersCollection() {
    return this.connection.collection('users');
  }

  private get positionsCollection() {
    return this.connection.collection('positions');
  }

  private get duelsCollection() {
    return this.connection.collection('duels');
  }

  private get userStatsCollection() {
    return this.connection.collection('user_stats');
  }

  /**
   * Get leaderboard with different types
   * @param type - 'global' | 'weekly' | 'profit' | 'duels' | 'xp'
   * @param limit - number of entries
   * @param userWallet - optional wallet to get user's position
   */
  async getLeaderboard(
    type: 'global' | 'weekly' | 'profit' | 'duels' | 'xp' = 'global',
    limit: number = 20,
    userWallet?: string,
  ): Promise<LeaderboardResponse> {
    const normalizedWallet = userWallet?.toLowerCase();

    let entries: LeaderboardEntry[] = [];
    let sortBy = 'pnl';

    switch (type) {
      case 'global':
      case 'profit':
        entries = await this.getProfitLeaderboard(limit);
        sortBy = 'pnl';
        break;
      case 'weekly':
        entries = await this.getWeeklyLeaderboard(limit);
        sortBy = 'weeklyPnl';
        break;
      case 'duels':
        entries = await this.getDuelsLeaderboard(limit);
        sortBy = 'duelWins';
        break;
      case 'xp':
        entries = await this.getXpLeaderboard(limit);
        sortBy = 'xp';
        break;
    }

    // Find user's position if wallet provided
    let userRank: number | undefined;
    let userEntry: LeaderboardEntry | undefined;

    if (normalizedWallet) {
      // Check if user is in top entries
      const inTop = entries.find(e => e.wallet === normalizedWallet);
      if (inTop) {
        userRank = inTop.rank;
        userEntry = inTop;
      } else {
        // Get user's actual position
        userEntry = await this.getUserStats(normalizedWallet);
        if (userEntry) {
          userRank = await this.getUserRank(normalizedWallet, type);
          userEntry.rank = userRank;
        }
      }
    }

    return {
      entries,
      userRank,
      userEntry,
      total: entries.length,
      period: type === 'weekly' ? 'This Week' : 'All Time',
      sortBy,
    };
  }

  /**
   * Get profit-based leaderboard (all time)
   */
  private async getProfitLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    // Aggregate positions to get PnL per wallet
    const pipeline = [
      {
        $match: {
          status: { $in: ['won', 'lost', 'claimed'] },
        },
      },
      {
        $group: {
          _id: '$wallet',
          totalPnl: { $sum: '$profit' },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          claimed: { $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          winrate: {
            $cond: [
              { $gt: [{ $add: ['$wins', '$losses'] }, 0] },
              { $multiply: [{ $divide: ['$wins', { $add: ['$wins', '$losses'] }] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalPnl: -1 } },
      { $limit: limit },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();

    // Enrich with XP and duel data
    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    for (const result of results) {
      const wallet = result._id;
      const xpStats = await this.userStatsCollection.findOne({ wallet });
      const duelStats = await this.getDuelStats(wallet);

      entries.push({
        rank: rank++,
        wallet,
        pnl: Math.round(result.totalPnl * 100) / 100,
        winrate: Math.round(result.winrate),
        totalBets: result.totalBets,
        wins: result.wins + result.claimed,
        losses: result.losses,
        duelWins: duelStats.wins,
        duelLosses: duelStats.losses,
        xp: xpStats?.xp || 0,
        level: xpStats?.level || 1,
        streak: xpStats?.currentStreak || 0,
        badges: xpStats?.badges || [],
      });
    }

    return entries;
  }

  /**
   * Get weekly leaderboard (last 7 days)
   */
  private async getWeeklyLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const pipeline = [
      {
        $match: {
          status: { $in: ['won', 'lost', 'claimed'] },
          resolvedAt: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: '$wallet',
          totalPnl: { $sum: '$profit' },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $in: ['$status', ['won', 'claimed']] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          winrate: {
            $cond: [
              { $gt: [{ $add: ['$wins', '$losses'] }, 0] },
              { $multiply: [{ $divide: ['$wins', { $add: ['$wins', '$losses'] }] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalPnl: -1 } },
      { $limit: limit },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();

    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    for (const result of results) {
      const wallet = result._id;
      const xpStats = await this.userStatsCollection.findOne({ wallet });
      const duelStats = await this.getDuelStats(wallet);

      entries.push({
        rank: rank++,
        wallet,
        pnl: Math.round(result.totalPnl * 100) / 100,
        winrate: Math.round(result.winrate),
        totalBets: result.totalBets,
        wins: result.wins,
        losses: result.losses,
        duelWins: duelStats.wins,
        duelLosses: duelStats.losses,
        xp: xpStats?.xp || 0,
        level: xpStats?.level || 1,
        streak: xpStats?.currentStreak || 0,
      });
    }

    return entries;
  }

  /**
   * Get duels leaderboard
   */
  private async getDuelsLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const pipeline = [
      {
        $match: {
          status: 'finished',
          winnerWallet: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$winnerWallet',
          duelWins: { $sum: 1 },
        },
      },
      { $sort: { duelWins: -1 } },
      { $limit: limit },
    ];

    const results = await this.duelsCollection.aggregate(pipeline).toArray();

    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    for (const result of results) {
      const wallet = result._id;
      const xpStats = await this.userStatsCollection.findOne({ wallet });
      const duelStats = await this.getDuelStats(wallet);
      const positionStats = await this.getPositionStats(wallet);

      entries.push({
        rank: rank++,
        wallet,
        pnl: positionStats.pnl,
        winrate: positionStats.winrate,
        totalBets: positionStats.totalBets,
        wins: positionStats.wins,
        losses: positionStats.losses,
        duelWins: duelStats.wins,
        duelLosses: duelStats.losses,
        xp: xpStats?.xp || 0,
        level: xpStats?.level || 1,
        streak: xpStats?.currentStreak || 0,
      });
    }

    return entries;
  }

  /**
   * Get XP leaderboard
   */
  private async getXpLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const users = await this.userStatsCollection
      .find({})
      .sort({ xp: -1 })
      .limit(limit)
      .toArray();

    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    for (const user of users) {
      const wallet = user.wallet;
      const duelStats = await this.getDuelStats(wallet);
      const positionStats = await this.getPositionStats(wallet);

      entries.push({
        rank: rank++,
        wallet,
        pnl: positionStats.pnl,
        winrate: positionStats.winrate,
        totalBets: user.totalBets || positionStats.totalBets,
        wins: user.totalWins || positionStats.wins,
        losses: user.totalLosses || positionStats.losses,
        duelWins: duelStats.wins,
        duelLosses: duelStats.losses,
        xp: user.xp || 0,
        level: user.level || 1,
        streak: user.currentStreak || 0,
        badges: user.badges || [],
      });
    }

    return entries;
  }

  /**
   * Get duel stats for a wallet
   */
  private async getDuelStats(wallet: string): Promise<{ wins: number; losses: number }> {
    const wins = await this.duelsCollection.countDocuments({
      winnerWallet: wallet,
      status: 'finished',
    });

    const totalDuels = await this.duelsCollection.countDocuments({
      $or: [
        { creatorWallet: wallet },
        { opponentWallet: wallet },
      ],
      status: 'finished',
    });

    return {
      wins,
      losses: totalDuels - wins,
    };
  }

  /**
   * Get position stats for a wallet
   */
  private async getPositionStats(wallet: string): Promise<{
    pnl: number;
    winrate: number;
    totalBets: number;
    wins: number;
    losses: number;
  }> {
    const pipeline = [
      {
        $match: {
          wallet,
          status: { $in: ['won', 'lost', 'claimed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalPnl: { $sum: '$profit' },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $in: ['$status', ['won', 'claimed']] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        },
      },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();
    const result = results[0] || { totalPnl: 0, totalBets: 0, wins: 0, losses: 0 };

    const totalDecided = result.wins + result.losses;
    const winrate = totalDecided > 0 ? (result.wins / totalDecided) * 100 : 0;

    return {
      pnl: Math.round(result.totalPnl * 100) / 100,
      winrate: Math.round(winrate),
      totalBets: result.totalBets,
      wins: result.wins,
      losses: result.losses,
    };
  }

  /**
   * Get user stats for leaderboard entry
   */
  private async getUserStats(wallet: string): Promise<LeaderboardEntry | null> {
    const xpStats = await this.userStatsCollection.findOne({ wallet });
    const duelStats = await this.getDuelStats(wallet);
    const positionStats = await this.getPositionStats(wallet);

    if (!xpStats && positionStats.totalBets === 0) {
      return null;
    }

    return {
      rank: 0, // Will be set by caller
      wallet,
      pnl: positionStats.pnl,
      winrate: positionStats.winrate,
      totalBets: positionStats.totalBets,
      wins: positionStats.wins,
      losses: positionStats.losses,
      duelWins: duelStats.wins,
      duelLosses: duelStats.losses,
      xp: xpStats?.xp || 0,
      level: xpStats?.level || 1,
      streak: xpStats?.currentStreak || 0,
      badges: xpStats?.badges || [],
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  private async getUserRank(wallet: string, type: string): Promise<number> {
    const positionStats = await this.getPositionStats(wallet);

    if (type === 'xp') {
      const xpStats = await this.userStatsCollection.findOne({ wallet });
      const xp = xpStats?.xp || 0;
      const higher = await this.userStatsCollection.countDocuments({ xp: { $gt: xp } });
      return higher + 1;
    }

    // For profit-based rankings
    const pipeline = [
      {
        $match: { status: { $in: ['won', 'lost', 'claimed'] } },
      },
      {
        $group: {
          _id: '$wallet',
          totalPnl: { $sum: '$profit' },
        },
      },
      {
        $match: { totalPnl: { $gt: positionStats.pnl } },
      },
      {
        $count: 'higher',
      },
    ];

    const results = await this.positionsCollection.aggregate(pipeline).toArray();
    const higher = results[0]?.higher || 0;

    return higher + 1;
  }
}
