import { Schema, model, Document } from 'mongoose';

export interface IUserStats extends Document {
  wallet: string;
  xp: number;
  level: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalPnl: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
  wallet: { type: String, required: true, unique: true, lowercase: true, index: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalBets: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  totalPnl: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
}, {
  timestamps: true,
});

// Calculate level from XP: level = floor(sqrt(xp / 100)) + 1
UserStatsSchema.methods.calculateLevel = function(): number {
  return Math.floor(Math.sqrt(this.xp / 100)) + 1;
};

// XP needed for next level
UserStatsSchema.methods.xpForNextLevel = function(): number {
  const nextLevel = this.level + 1;
  return (nextLevel - 1) * (nextLevel - 1) * 100;
};

export const UserStatsModel = model<IUserStats>('UserStats', UserStatsSchema);

// Badge definitions
export const BADGES = {
  FIRST_BET: { id: 'first_bet', name: 'First Bet', emoji: '🎯', description: 'Placed your first bet' },
  FIRST_WIN: { id: 'first_win', name: 'First Win', emoji: '🏆', description: 'Won your first prediction' },
  STREAK_3: { id: 'streak_3', name: 'Hot Streak', emoji: '🔥', description: '3 wins in a row' },
  STREAK_5: { id: 'streak_5', name: 'On Fire', emoji: '💥', description: '5 wins in a row' },
  STREAK_10: { id: 'streak_10', name: 'Unstoppable', emoji: '⚡', description: '10 wins in a row' },
  PROFIT_100: { id: 'profit_100', name: 'Profit Hunter', emoji: '💰', description: 'Earned +100 USDT profit' },
  PROFIT_1000: { id: 'profit_1000', name: 'Big Winner', emoji: '💎', description: 'Earned +1000 USDT profit' },
  BETS_10: { id: 'bets_10', name: 'Getting Started', emoji: '📈', description: 'Placed 10 bets' },
  BETS_50: { id: 'bets_50', name: 'Regular', emoji: '🎲', description: 'Placed 50 bets' },
  BETS_100: { id: 'bets_100', name: 'Veteran', emoji: '⭐', description: 'Placed 100 bets' },
};

// XP rewards
export const XP_REWARDS = {
  BET_PLACED: 10,
  WIN: 50,
  LOSS: 5,
  CLAIM: 20,
  STREAK_3: 100,
  STREAK_5: 200,
  STREAK_10: 500,
};
