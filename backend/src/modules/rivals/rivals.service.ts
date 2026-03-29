import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rivalry, RivalryDocument } from './rivals.schema';

/**
 * Helper to normalize wallet pair
 * Ensures walletA < walletB alphabetically to prevent duplicates
 */
function normalizePair(a: string, b: string): { walletA: string; walletB: string } {
  const [walletA, walletB] = [a.toLowerCase(), b.toLowerCase()].sort();
  return { walletA, walletB };
}

export interface RivalStats {
  opponent: string;
  totalDuels: number;
  wins: number;
  losses: number;
  lastWinner: string | null;
  lastDuelAt: Date | null;
  currentStreakAgainstYou: number;
  currentStreakByYou: number;
  dominance: 'you' | 'them' | 'even';
  canRematch: boolean;
  lastStake: number;
}

export interface HeadToHead {
  wallet: string;
  opponent: string;
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  lastWinner: string | null;
  lastLoser: string | null;
  lastDuelAt: Date | null;
  currentStreakWallet: string | null;
  currentStreakCount: number;
  dominanceText: string;
}

@Injectable()
export class RivalsService {
  private readonly logger = new Logger(RivalsService.name);

  constructor(
    @InjectModel(Rivalry.name) private rivalryModel: Model<RivalryDocument>,
  ) {}

  /**
   * Update rivalry after a resolved duel
   * Called from duel-resolution.service when duel is resolved
   */
  async updateAfterResolvedDuel(duel: {
    _id: string;
    creatorWallet: string;
    opponentWallet: string;
    winnerWallet: string;
    stakeAmount?: number;
  }) {
    if (!duel.creatorWallet || !duel.opponentWallet || !duel.winnerWallet) {
      this.logger.warn('Cannot update rivalry: missing wallet data');
      return null;
    }

    const { walletA, walletB } = normalizePair(duel.creatorWallet, duel.opponentWallet);
    const winner = duel.winnerWallet.toLowerCase();
    const loser = duel.creatorWallet.toLowerCase() === winner
      ? duel.opponentWallet.toLowerCase()
      : duel.creatorWallet.toLowerCase();

    try {
      let rivalry = await this.rivalryModel.findOne({ walletA, walletB });

      if (!rivalry) {
        rivalry = new this.rivalryModel({
          walletA,
          walletB,
          totalDuels: 0,
          winsA: 0,
          winsB: 0,
          duelIds: [],
          currentStreakCount: 0,
        });
      }

      // Update stats
      rivalry.totalDuels += 1;
      rivalry.duelIds.push(String(duel._id));
      rivalry.lastDuelAt = new Date();
      rivalry.lastWinner = winner;
      rivalry.lastLoser = loser;
      rivalry.lastStake = duel.stakeAmount || rivalry.lastStake || 10;

      // Update wins
      if (winner === walletA) {
        rivalry.winsA += 1;
      } else {
        rivalry.winsB += 1;
      }

      // Update streak
      if (rivalry.currentStreakWallet === winner) {
        rivalry.currentStreakCount += 1;
      } else {
        rivalry.currentStreakWallet = winner;
        rivalry.currentStreakCount = 1;
      }

      await rivalry.save();

      this.logger.log(`Rivalry updated: ${walletA} vs ${walletB}, winner: ${winner}, streak: ${rivalry.currentStreakCount}`);

      return rivalry;
    } catch (error) {
      this.logger.error(`Failed to update rivalry: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all rivals for a wallet
   * Returns list sorted by totalDuels (most active rivalries first)
   */
  async getRivalsForWallet(wallet: string): Promise<RivalStats[]> {
    const normalizedWallet = wallet.toLowerCase();

    const rivalries = await this.rivalryModel.find({
      $or: [
        { walletA: normalizedWallet },
        { walletB: normalizedWallet },
      ],
    }).sort({ totalDuels: -1 }).limit(20);

    return rivalries.map(rivalry => {
      const isA = rivalry.walletA === normalizedWallet;
      const opponent = isA ? rivalry.walletB : rivalry.walletA;
      const wins = isA ? rivalry.winsA : rivalry.winsB;
      const losses = isA ? rivalry.winsB : rivalry.winsA;

      // Calculate streak against/by user
      let currentStreakAgainstYou = 0;
      let currentStreakByYou = 0;
      
      if (rivalry.currentStreakWallet === normalizedWallet) {
        currentStreakByYou = rivalry.currentStreakCount;
      } else if (rivalry.currentStreakWallet === opponent) {
        currentStreakAgainstYou = rivalry.currentStreakCount;
      }

      // Determine dominance
      let dominance: 'you' | 'them' | 'even' = 'even';
      if (wins > losses) dominance = 'you';
      else if (losses > wins) dominance = 'them';

      return {
        opponent,
        totalDuels: rivalry.totalDuels,
        wins,
        losses,
        lastWinner: rivalry.lastWinner || null,
        lastDuelAt: rivalry.lastDuelAt || null,
        currentStreakAgainstYou,
        currentStreakByYou,
        dominance,
        canRematch: true,
        lastStake: rivalry.lastStake || 10,
      };
    });
  }

  /**
   * Get head-to-head stats between two wallets
   */
  async getHeadToHead(wallet: string, opponent: string): Promise<HeadToHead | null> {
    const { walletA, walletB } = normalizePair(wallet, opponent);
    const normalizedWallet = wallet.toLowerCase();

    const rivalry = await this.rivalryModel.findOne({ walletA, walletB });

    if (!rivalry) {
      return null;
    }

    const isA = rivalry.walletA === normalizedWallet;
    const wins = isA ? rivalry.winsA : rivalry.winsB;
    const losses = isA ? rivalry.winsB : rivalry.winsA;
    const winRate = rivalry.totalDuels > 0 
      ? Math.round((wins / rivalry.totalDuels) * 100) 
      : 0;

    // Generate dominance text
    let dominanceText = 'Evenly matched';
    if (wins > losses * 2) {
      dominanceText = 'You dominate this rivalry';
    } else if (losses > wins * 2) {
      dominanceText = 'They dominate this rivalry';
    } else if (wins > losses) {
      dominanceText = 'You have the edge';
    } else if (losses > wins) {
      dominanceText = 'They have the edge';
    }

    // Add streak info to dominance text
    if (rivalry.currentStreakCount >= 3) {
      if (rivalry.currentStreakWallet === normalizedWallet) {
        dominanceText = `🔥 You're on a ${rivalry.currentStreakCount}-win streak!`;
      } else {
        dominanceText = `💥 They're on a ${rivalry.currentStreakCount}-win streak`;
      }
    }

    return {
      wallet: normalizedWallet,
      opponent: isA ? rivalry.walletB : rivalry.walletA,
      totalDuels: rivalry.totalDuels,
      wins,
      losses,
      winRate,
      lastWinner: rivalry.lastWinner || null,
      lastLoser: rivalry.lastLoser || null,
      lastDuelAt: rivalry.lastDuelAt || null,
      currentStreakWallet: rivalry.currentStreakWallet || null,
      currentStreakCount: rivalry.currentStreakCount,
      dominanceText,
    };
  }

  /**
   * Get top rival (most duels) for a wallet
   */
  async getTopRival(wallet: string): Promise<RivalStats | null> {
    const rivals = await this.getRivalsForWallet(wallet);
    return rivals.length > 0 ? rivals[0] : null;
  }

  /**
   * Get nemesis (most losses against) for a wallet
   */
  async getNemesis(wallet: string): Promise<RivalStats | null> {
    const rivals = await this.getRivalsForWallet(wallet);
    const nemesis = rivals
      .filter(r => r.losses > r.wins)
      .sort((a, b) => b.losses - a.losses)[0];
    return nemesis || null;
  }

  /**
   * Get rivalry summary stats for a wallet
   */
  async getRivalrySummary(wallet: string): Promise<{
    totalRivals: number;
    totalRivalryDuels: number;
    dominatedCount: number;
    dominatedByCount: number;
    longestStreak: number;
    topRival: RivalStats | null;
    nemesis: RivalStats | null;
  }> {
    const rivals = await this.getRivalsForWallet(wallet);

    const totalRivals = rivals.length;
    const totalRivalryDuels = rivals.reduce((sum, r) => sum + r.totalDuels, 0);
    const dominatedCount = rivals.filter(r => r.dominance === 'you').length;
    const dominatedByCount = rivals.filter(r => r.dominance === 'them').length;
    const longestStreak = Math.max(...rivals.map(r => r.currentStreakByYou), 0);

    const topRival = rivals.length > 0 ? rivals[0] : null;
    const nemesis = rivals
      .filter(r => r.dominance === 'them')
      .sort((a, b) => b.losses - a.losses)[0] || null;

    return {
      totalRivals,
      totalRivalryDuels,
      dominatedCount,
      dominatedByCount,
      longestStreak,
      topRival,
      nemesis,
    };
  }
}
