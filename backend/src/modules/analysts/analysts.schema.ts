import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalystDocument = Analyst & Document;

@Schema({ timestamps: true })
export class AnalystStats {
  @Prop({ default: 0 })
  totalPredictions: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  bestStreak: number;
}

@Schema({ timestamps: true })
export class AnalystPerformance {
  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  accuracy: number;

  @Prop({ default: 0 })
  totalStake: number;

  @Prop({ default: 0 })
  totalProfit: number;
}

@Schema({ timestamps: true })
export class AnalystDuelStats {
  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  totalPot: number;

  @Prop({ default: 0 })
  winnings: number;
}

@Schema({ timestamps: true })
export class Analyst {
  @Prop({ required: true, unique: true, index: true })
  wallet: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop()
  bio: string;

  @Prop({ type: AnalystStats, default: () => ({}) })
  stats: AnalystStats;

  @Prop({ type: AnalystPerformance, default: () => ({}) })
  performance: AnalystPerformance;

  @Prop({ type: AnalystDuelStats, default: () => ({}) })
  duelStats: AnalystDuelStats;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 'bronze' })
  tier: string; // bronze, silver, gold, platinum, diamond

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: 0 })
  leaguePoints: number;

  @Prop()
  referredBy?: string; // wallet of referrer

  @Prop({ default: false })
  referralBonusAwarded?: boolean;
}

export const AnalystSchema = SchemaFactory.createForClass(Analyst);

AnalystSchema.index({ 'performance.roi': -1 });
AnalystSchema.index({ 'performance.accuracy': -1 });
AnalystSchema.index({ xp: -1 });
AnalystSchema.index({ leaguePoints: -1 });
AnalystSchema.index({ referredBy: 1 });
