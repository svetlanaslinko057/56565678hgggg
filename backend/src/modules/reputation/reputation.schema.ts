import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CreatorReputationDocument = CreatorReputation & Document;

export enum ReputationTier {
  NEWCOMER = 'newcomer',
  TRUSTED = 'trusted',
  VERIFIED = 'verified',
  ELITE = 'elite',
}

@Schema({ timestamps: true })
export class CreatorReputation {
  @Prop({ required: true, unique: true, lowercase: true })
  wallet: string;

  // Core metrics
  @Prop({ default: 0 })
  score: number;

  @Prop({ type: String, enum: ReputationTier, default: ReputationTier.NEWCOMER })
  tier: ReputationTier;

  // Market creation stats
  @Prop({ default: 0 })
  marketsCreated: number;

  @Prop({ default: 0 })
  marketsApproved: number;

  @Prop({ default: 0 })
  marketsRejected: number;

  @Prop({ default: 0 })
  marketsDisputed: number;

  // Performance metrics
  @Prop({ default: 0 })
  totalVolume: number;

  @Prop({ default: 0 })
  avgMarketVolume: number;

  @Prop({ default: 0 })
  totalParticipants: number;

  // Stake stats
  @Prop({ default: 0 })
  totalStakeLocked: number;

  @Prop({ default: 0 })
  totalStakeBurned: number;

  @Prop({ default: 0 })
  totalStakeReturned: number;

  // Calculated bonuses
  @Prop({ default: 100 })
  requiredStake: number;

  @Prop({ default: false })
  fastApproval: boolean;

  @Prop({ default: false })
  priorityListing: boolean;
}

export const CreatorReputationSchema = SchemaFactory.createForClass(CreatorReputation);

// Indexes
CreatorReputationSchema.index({ wallet: 1 });
CreatorReputationSchema.index({ score: -1 });
CreatorReputationSchema.index({ tier: 1 });
