import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalystProfileDocument = AnalystProfile & Document;

@Schema({ timestamps: true })
export class AnalystProfile {
  @Prop({ required: true, unique: true, lowercase: true })
  wallet: string;

  @Prop()
  username?: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  // Performance
  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  accuracy: number;

  @Prop({ default: 0 })
  totalPredictions: number;

  @Prop({ default: 0 })
  winningPredictions: number;

  @Prop({ default: 0 })
  totalVolume: number;

  @Prop({ default: 0 })
  totalProfit: number;

  // Social
  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ type: [String], default: [] })
  followers: string[];

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ type: [String], default: [] })
  following: string[];

  // Streak info (denormalized for quick access)
  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  bestStreak: number;

  // Ranking
  @Prop({ default: 0 })
  rank: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [String], default: [] })
  badges: string[];
}

export const AnalystProfileSchema = SchemaFactory.createForClass(AnalystProfile);

AnalystProfileSchema.index({ wallet: 1 });
AnalystProfileSchema.index({ roi: -1 });
AnalystProfileSchema.index({ accuracy: -1 });
AnalystProfileSchema.index({ followersCount: -1 });
