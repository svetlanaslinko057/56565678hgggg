import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArenaUserDocument = ArenaUser & Document;

export enum UserSource {
  PLATFORM = 'platform',
  ARENA = 'arena',
  TELEGRAM = 'telegram',
}

export enum UserTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

@Schema({ _id: false })
export class UserStats {
  @Prop({ default: 0 })
  totalBets: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  totalStaked: number;

  @Prop({ default: 0 })
  totalProfit: number;

  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  accuracy: number;
}

@Schema({ _id: false })
export class DuelStats {
  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop({ default: 0 })
  bestStreak: number;
}

@Schema({ _id: false })
export class UserSocials {
  @Prop({ default: '' })
  twitter: string;

  @Prop({ default: '' })
  discord: string;

  @Prop({ default: '' })
  telegram: string;

  @Prop({ default: '' })
  website: string;
}

@Schema({ _id: false })
export class UserNotifications {
  @Prop({ default: true })
  email: boolean;

  @Prop({ default: true })
  push: boolean;

  @Prop({ default: false })
  marketing: boolean;

  @Prop({ default: true })
  trades: boolean;

  @Prop({ default: true })
  mentions: boolean;
}

@Schema({ _id: false })
export class UserPrivacy {
  @Prop({ default: true })
  showBalance: boolean;

  @Prop({ default: true })
  showActivity: boolean;

  @Prop({ default: true })
  showPositions: boolean;
}

@Schema({ _id: false })
export class UserSecurity {
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ type: String, default: null })
  twoFactorMethod: string | null;

  @Prop({ type: String, default: null })
  twoFactorSecret: string | null;

  @Prop({ type: [String], default: [] })
  recoveryCodes: string[];

  @Prop({ type: Date, default: null })
  twoFactorEnabledAt: Date | null;

  @Prop({ type: Date, default: null })
  lastPasswordChange: Date | null;
}

@Schema({ timestamps: true })
export class ArenaUser {
  @Prop({ required: true, unique: true, lowercase: true })
  wallet: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop()
  bio: string;

  @Prop()
  platformUserId: string;

  @Prop()
  telegramId: string;

  @Prop({ type: String, enum: UserSource, default: UserSource.ARENA })
  source: UserSource;

  // ========== BALANCE (SOURCE OF TRUTH) ==========
  @Prop({ default: 0 })
  balanceUsdt: number;

  @Prop({ default: false })
  isFrozen: boolean;

  @Prop({ default: false })
  isVerified: boolean;
  // ===============================================

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 0 })
  leaguePoints: number;

  @Prop({ type: String, enum: UserTier, default: UserTier.BRONZE })
  tier: UserTier;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ type: UserStats, default: {} })
  stats: UserStats;

  @Prop({ type: DuelStats, default: {} })
  duelStats: DuelStats;

  // ========== SETTINGS ==========
  @Prop()
  email: string;

  @Prop({ type: UserSocials, default: {} })
  socials: UserSocials;

  @Prop({ type: UserNotifications, default: {} })
  notifications: UserNotifications;

  @Prop({ type: UserPrivacy, default: {} })
  privacy: UserPrivacy;

  @Prop({ type: UserSecurity, default: {} })
  security: UserSecurity;
  // ==============================

  // ========== STREAK SYSTEM ==========
  @Prop({ default: 0 })
  streakCurrent: number;

  @Prop({ default: 0 })
  streakBest: number;
  // ===================================

  @Prop()
  lastLoginAt: Date;

  @Prop()
  nonce: string;
}

export const ArenaUserSchema = SchemaFactory.createForClass(ArenaUser);

// Indexes
ArenaUserSchema.index({ platformUserId: 1 }, { sparse: true });
ArenaUserSchema.index({ telegramId: 1 }, { sparse: true });
ArenaUserSchema.index({ leaguePoints: -1 });
ArenaUserSchema.index({ xp: -1 });
