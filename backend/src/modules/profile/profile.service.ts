import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArenaUser } from '../users/users.schema';
import { Position, PositionStatus } from '../positions/positions.schema';

export interface UserProfileStats {
  totalInvested: number;
  currentValue: number;
  realizedPnL: number;
  activePositions: number;
  totalBets: number;
  won: number;
  lost: number;
  winRate: number;
  xp: number;
  level: number;
  tier: string;
  leaguePoints: number;
  totalVolume: number;
  avgBetSize: number;
  rank: number;
  streakCurrent: number;
  streakBest: number;
}

export interface ProfilePosition {
  id: string;
  marketId: string;
  marketTitle: string;
  outcomeLabel: string;
  stake: number;
  odds: number;
  potentialReturn: number;
  status: string;
  payout?: number;
  profit?: number;
  pnl?: number;
  roi?: number;
  createdAt: Date;
  resolvedAt?: Date;
  claimedAt?: Date;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel('ArenaUser') private userModel: Model<ArenaUser>,
    @InjectModel('Position') private positionModel: Model<Position>,
    @InjectModel('ActivityEvent') private activityModel: Model<any>,
    @InjectModel('Prediction') private predictionModel: Model<any>,
  ) {}

  async getProfile(wallet: string) {
    const walletLower = wallet.toLowerCase();
    let user = await this.userModel.findOne({ wallet: walletLower }).lean();
    
    // If user not found, create basic profile
    if (!user) {
      // Return basic profile structure for new users
      return {
        wallet: walletLower,
        username: this.shortWallet(walletLower),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletLower}`,
        bio: '',
        email: '',
        tier: 'bronze',
        badges: [],
        isVerified: false,
        xp: 0,
        leaguePoints: 0,
        socials: { twitter: '', discord: '', telegram: '', website: '' },
        notifications: { email: true, push: true, marketing: false, trades: true, mentions: true },
        privacy: { showBalance: true, showActivity: true, showPositions: true },
        security: { twoFactorEnabled: false, twoFactorMethod: null, lastPasswordChange: null },
        createdAt: new Date(),
      };
    }

    return {
      wallet: user.wallet,
      username: user.username || this.shortWallet(user.wallet),
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.wallet}`,
      bio: user.bio || '',
      email: (user as any).email || '',
      tier: user.tier || 'bronze',
      badges: user.badges || [],
      isVerified: user.isVerified || false,
      xp: user.xp || 0,
      leaguePoints: user.leaguePoints || 0,
      socials: (user as any).socials || { twitter: '', discord: '', telegram: '', website: '' },
      notifications: (user as any).notifications || { email: true, push: true, marketing: false, trades: true, mentions: true },
      privacy: (user as any).privacy || { showBalance: true, showActivity: true, showPositions: true },
      security: (user as any).security || { twoFactorEnabled: false, twoFactorMethod: null, lastPasswordChange: null },
      createdAt: (user as any).createdAt,
    };
  }

  async updateProfile(wallet: string, updates: {
    username?: string;
    avatar?: string;
    bio?: string;
    email?: string;
    socials?: { twitter?: string; discord?: string; telegram?: string; website?: string };
    notifications?: { email?: boolean; push?: boolean; marketing?: boolean; trades?: boolean; mentions?: boolean };
    privacy?: { showBalance?: boolean; showActivity?: boolean; showPositions?: boolean };
    security?: { twoFactorEnabled?: boolean; twoFactorMethod?: string | null };
  }) {
    const walletLower = wallet.toLowerCase();
    
    // Build update object - only include provided fields
    const updateFields: any = { updatedAt: new Date() };
    
    if (updates.username !== undefined) updateFields.username = updates.username;
    if (updates.avatar !== undefined) updateFields.avatar = updates.avatar;
    if (updates.bio !== undefined) updateFields.bio = updates.bio;
    if (updates.email !== undefined) updateFields.email = updates.email;
    
    // Handle nested objects with dot notation for partial updates
    if (updates.socials) {
      if (updates.socials.twitter !== undefined) updateFields['socials.twitter'] = updates.socials.twitter;
      if (updates.socials.discord !== undefined) updateFields['socials.discord'] = updates.socials.discord;
      if (updates.socials.telegram !== undefined) updateFields['socials.telegram'] = updates.socials.telegram;
      if (updates.socials.website !== undefined) updateFields['socials.website'] = updates.socials.website;
    }
    
    if (updates.notifications) {
      if (updates.notifications.email !== undefined) updateFields['notifications.email'] = updates.notifications.email;
      if (updates.notifications.push !== undefined) updateFields['notifications.push'] = updates.notifications.push;
      if (updates.notifications.marketing !== undefined) updateFields['notifications.marketing'] = updates.notifications.marketing;
      if (updates.notifications.trades !== undefined) updateFields['notifications.trades'] = updates.notifications.trades;
      if (updates.notifications.mentions !== undefined) updateFields['notifications.mentions'] = updates.notifications.mentions;
    }
    
    if (updates.privacy) {
      if (updates.privacy.showBalance !== undefined) updateFields['privacy.showBalance'] = updates.privacy.showBalance;
      if (updates.privacy.showActivity !== undefined) updateFields['privacy.showActivity'] = updates.privacy.showActivity;
      if (updates.privacy.showPositions !== undefined) updateFields['privacy.showPositions'] = updates.privacy.showPositions;
    }
    
    if (updates.security) {
      if (updates.security.twoFactorEnabled !== undefined) updateFields['security.twoFactorEnabled'] = updates.security.twoFactorEnabled;
      if (updates.security.twoFactorMethod !== undefined) updateFields['security.twoFactorMethod'] = updates.security.twoFactorMethod;
    }
    
    // Upsert - create if doesn't exist
    const user = await this.userModel.findOneAndUpdate(
      { wallet: walletLower },
      { $set: updateFields },
      { new: true, upsert: true },
    ).lean();

    return this.getProfile(walletLower);
  }

  async getStats(wallet: string): Promise<UserProfileStats> {
    const walletLower = wallet.toLowerCase();
    
    // Get all positions for user
    const positions = await this.positionModel.find({ wallet: walletLower }).lean();
    
    // Calculate stats
    const activePositions = positions.filter(p => p.status === PositionStatus.OPEN || p.status === PositionStatus.LISTED);
    const wonPositions = positions.filter(p => p.status === PositionStatus.WON || p.status === PositionStatus.CLAIMED);
    const lostPositions = positions.filter(p => p.status === PositionStatus.LOST);
    const resolvedPositions = [...wonPositions, ...lostPositions];
    
    const totalInvested = positions.reduce((sum, p) => sum + (p.stake || 0), 0);
    const totalVolume = totalInvested;
    
    // Current value = active positions potential + claimed payouts
    const activeValue = activePositions.reduce((sum, p) => sum + (p.potentialReturn || 0), 0);
    const claimedPayouts = positions
      .filter(p => p.status === PositionStatus.CLAIMED)
      .reduce((sum, p) => sum + (p.payout || 0), 0);
    const currentValue = activeValue + claimedPayouts;
    
    // PnL = payouts received - stakes lost
    const stakesLost = lostPositions.reduce((sum, p) => sum + (p.stake || 0), 0);
    const realizedPnL = claimedPayouts - stakesLost;
    
    const totalBets = positions.length;
    const won = wonPositions.length;
    const lost = lostPositions.length;
    const winRate = resolvedPositions.length > 0 ? (won / resolvedPositions.length) * 100 : 0;
    const avgBetSize = totalBets > 0 ? totalVolume / totalBets : 0;
    
    // Get user for XP/level/tier
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    
    // Calculate level from XP (simple formula: level = floor(sqrt(xp/100)))
    const xp = user?.xp || 0;
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    
    // Get rank from leaderboard position
    const rank = await this.calculateRank(walletLower);
    
    return {
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      realizedPnL: Math.round(realizedPnL * 100) / 100,
      activePositions: activePositions.length,
      totalBets,
      won,
      lost,
      winRate: Math.round(winRate * 10) / 10,
      xp,
      level,
      tier: user?.tier || 'bronze',
      leaguePoints: user?.leaguePoints || 0,
      totalVolume: Math.round(totalVolume * 100) / 100,
      avgBetSize: Math.round(avgBetSize * 100) / 100,
      rank,
      streakCurrent: user?.streakCurrent || 0,
      streakBest: user?.streakBest || 0,
    };
  }

  async getPositions(
    wallet: string,
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: ProfilePosition[]; total: number }> {
    const walletLower = wallet.toLowerCase();
    const skip = (page - 1) * limit;
    
    const query: any = { wallet: walletLower };
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: [PositionStatus.OPEN, PositionStatus.LISTED] };
      } else {
        query.status = status;
      }
    }
    
    const [positions, total] = await Promise.all([
      this.positionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.positionModel.countDocuments(query),
    ]);
    
    // Enrich with market titles
    const marketIds = [...new Set(positions.map(p => p.predictionId))];
    const markets = await this.predictionModel.find({ _id: { $in: marketIds } }).lean();
    const marketMap = new Map(markets.map(m => [(m as any)._id.toString(), m]));
    
    const enrichedPositions: ProfilePosition[] = positions.map(p => {
      const market = marketMap.get(p.predictionId);
      const pnl = p.status === PositionStatus.CLAIMED || p.status === PositionStatus.WON
        ? (p.payout || 0) - p.stake
        : p.status === PositionStatus.LOST
        ? -p.stake
        : 0;
      const roi = p.stake > 0 ? (pnl / p.stake) * 100 : 0;
      
      return {
        id: (p as any)._id.toString(),
        marketId: p.marketId,
        marketTitle: (market as any)?.question || 'Unknown Market',
        outcomeLabel: p.outcomeLabel,
        stake: p.stake,
        odds: p.odds,
        potentialReturn: p.potentialReturn,
        status: p.status,
        payout: p.payout,
        profit: p.profit,
        pnl: Math.round(pnl * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        createdAt: (p as any).createdAt,
        resolvedAt: p.resolvedAt,
        claimedAt: p.claimedAt,
      };
    });
    
    return { data: enrichedPositions, total };
  }

  async getActivity(wallet: string, limit = 10, type?: string) {
    const walletLower = wallet.toLowerCase();
    
    const query: any = { user: walletLower };
    if (type && type !== 'all') {
      query.eventName = type;
    }
    
    const activities = await this.activityModel
      .find(query)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    
    return activities.map(a => ({
      id: (a as any)._id.toString(),
      type: a.eventName,
      marketId: a.marketId,
      marketTitle: a.marketTitle || 'Unknown Market',
      amount: a.amount,
      outcomeId: a.outcomeId,
      timestamp: a.timestamp || a.createdAt,
    }));
  }

  private async calculateRank(wallet: string): Promise<number> {
    // Count users with more league points
    const user = await this.userModel.findOne({ wallet }).lean();
    if (!user) return 0;
    
    const higherRanked = await this.userModel.countDocuments({
      leaguePoints: { $gt: user.leaguePoints || 0 },
    });
    
    return higherRanked + 1;
  }

  private shortWallet(wallet: string): string {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  }
}
