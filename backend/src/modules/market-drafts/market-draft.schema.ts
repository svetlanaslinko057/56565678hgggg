import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketDraftDocument = MarketDraft & Document;

export enum DraftStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export enum StakeStatus {
  LOCKED = 'locked',
  RETURNED = 'returned',
  BURNED = 'burned',
  PARTIAL_REFUND = 'partial_refund',
}

export enum ResolutionType {
  MANUAL = 'manual',
  ORACLE = 'oracle',
  COMMUNITY = 'community',
}

@Schema({ _id: false })
export class OracleConfig {
  @Prop({ required: true })
  source: string; // coingecko, chainlink, etc.

  @Prop({ required: true })
  asset: string; // BTC, ETH, etc.

  @Prop({ required: true })
  operator: string; // >, <, =, >=, <=

  @Prop({ required: true })
  value: number;

  @Prop()
  apiEndpoint?: string;

  @Prop()
  jsonPath?: string;
}

@Schema({ _id: false })
export class DraftOutcome {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 50 })
  probability: number;
}

@Schema({ timestamps: true })
export class MarketDraft {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  type: string; // single, multi-level, conditional

  @Prop({ type: [DraftOutcome], default: [] })
  outcomes: DraftOutcome[];

  @Prop()
  category: string;

  @Prop({ required: true })
  closeTime: Date;

  @Prop({ required: true })
  creatorWallet: string;

  @Prop({ type: String, enum: DraftStatus, default: DraftStatus.DRAFT })
  status: DraftStatus;

  // Stake system
  @Prop({ required: true, default: 100 })
  stakeAmount: number;

  @Prop({ type: String, enum: StakeStatus, default: StakeStatus.LOCKED })
  stakeStatus: StakeStatus;

  @Prop()
  stakeLedgerRef: string;

  // Resolution config
  @Prop({ type: String, enum: ResolutionType, default: ResolutionType.MANUAL })
  resolutionType: ResolutionType;

  @Prop({ type: OracleConfig })
  oracleConfig?: OracleConfig;

  // Moderation
  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  publishedMarketId?: string;

  // Metadata
  @Prop()
  logo?: string;

  @Prop()
  subtitle?: string;

  @Prop()
  resolutionSource?: string;
}

export const MarketDraftSchema = SchemaFactory.createForClass(MarketDraft);

// Indexes
MarketDraftSchema.index({ status: 1 });
MarketDraftSchema.index({ creatorWallet: 1 });
MarketDraftSchema.index({ createdAt: -1 });
