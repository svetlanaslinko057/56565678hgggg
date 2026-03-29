import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PredictionDocument = Prediction & Document;

export enum PredictionStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  LOCKED = 'locked',
  RESOLVED = 'resolved',
  DISPUTED = 'disputed',
  CANCELED = 'canceled',
}

export enum PredictionType {
  SINGLE = 'single',
  MULTI_LEVEL = 'multi-level',
  TGE_IDO = 'tge-ido',
  CONDITIONAL = 'conditional',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// ==================== Resolution Engine V1 ====================

export enum ResolutionMode {
  ORACLE = 'oracle',
  ADMIN = 'admin',
}

export enum OracleMetric {
  PRICE = 'price',
  FDV = 'fdv',
  MARKET_CAP = 'market_cap',
  VOLUME_24H = 'volume_24h',
  TVL = 'tvl',
}

export enum OracleOperator {
  GTE = '>=',
  GT = '>',
  LTE = '<=',
  LT = '<',
  EQ = '==',
}

export enum ResolutionStatus {
  PENDING = 'pending',
  READY_FOR_CHECK = 'ready_for_check',
  AUTO_RESOLVED = 'auto_resolved',
  MANUAL_REVIEW = 'manual_review',
  RESOLVED = 'resolved',
  DISPUTED = 'disputed',
  FAILED = 'failed',
}

export enum ResolutionOutcome {
  YES = 'yes',
  NO = 'no',
  INVALID = 'invalid',
}

@Schema({ _id: false })
export class ResolutionConfig {
  @Prop({ type: String, enum: ResolutionMode, required: true })
  mode: ResolutionMode;

  // Oracle config
  @Prop({ type: String, enum: OracleMetric })
  metric?: OracleMetric;

  @Prop()
  asset?: string; // e.g. 'bitcoin', 'ethereum'

  @Prop({ default: 'coingecko' })
  source?: string;

  @Prop({ type: String, enum: OracleOperator })
  operator?: OracleOperator;

  @Prop()
  targetValue?: number;

  @Prop()
  evaluationTime?: Date;

  @Prop()
  referenceWindowMinutes?: number;

  // Admin config
  @Prop()
  instructions?: string; // What counts as YES/NO

  @Prop({ default: false })
  adminNotesRequired?: boolean;

  // Resolution state
  @Prop({ type: String, enum: ResolutionStatus, default: ResolutionStatus.PENDING })
  status: ResolutionStatus;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string; // 'oracle' | 'admin' | 'community'

  @Prop({ type: String, enum: ResolutionOutcome })
  resolvedOutcome?: ResolutionOutcome;

  @Prop()
  resolutionReason?: string;

  @Prop({ type: Object })
  resolutionPayload?: Record<string, any>;

  @Prop()
  actualValue?: number; // Value fetched from oracle

  @Prop()
  lastOracleCheck?: Date;

  @Prop({ default: false })
  disputable?: boolean;
}

// Legacy OracleConfig for backward compatibility
export enum OracleMethod {
  MANUAL = 'manual',
  PRICE_FEED = 'price_feed',
  COMMUNITY_VOTE = 'community_vote',
}

@Schema({ _id: false })
export class OracleConfig {
  @Prop({ type: String, enum: OracleMethod, default: OracleMethod.MANUAL })
  method: OracleMethod;

  @Prop()
  asset: string;

  @Prop()
  targetValue: number;

  @Prop()
  operator: string;
}

@Schema({ _id: false })
export class Outcome {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 50 })
  probability: number;

  @Prop({ default: 2.0 })
  yesMultiplier: number;

  @Prop({ default: 2.0 })
  noMultiplier: number;
}

@Schema({ _id: false })
export class ChainData {
  @Prop()
  chainId: number;

  @Prop()
  contractAddress: string;

  @Prop()
  marketId: string;
}

@Schema({ _id: false })
export class AISentiment {
  @Prop()
  sentiment: string;

  @Prop()
  description: string;

  @Prop()
  momentumIndicator: string;

  @Prop()
  attentionIndex: string;

  @Prop()
  consensusStrength: string;

  @Prop()
  volatilityPressure: string;

  @Prop()
  narrativeDirection: string;

  @Prop()
  fullDescription: string;

  @Prop()
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ required: true })
  question: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: PredictionType, default: PredictionType.SINGLE })
  type: PredictionType;

  @Prop({ type: [Outcome], default: [] })
  outcomes: Outcome[];

  @Prop()
  category: string;

  @Prop({ type: String, enum: RiskLevel, default: RiskLevel.MEDIUM })
  riskLevel: RiskLevel;

  @Prop({ required: true })
  closeTime: Date;

  @Prop()
  resolveTime: Date;

  @Prop({ type: String, enum: PredictionStatus, default: PredictionStatus.DRAFT })
  status: PredictionStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ type: ChainData })
  chain: ChainData;

  @Prop({ type: AISentiment })
  aiSentiment: AISentiment;

  @Prop()
  logo: string;

  @Prop()
  subtitle: string;

  @Prop({ default: 0 })
  totalVolume: number;

  @Prop({ default: 0 })
  totalBets: number;

  @Prop()
  resolutionSource: string;

  @Prop()
  winningOutcome: string;

  @Prop()
  resolvedAt: Date;

  @Prop({ type: OracleConfig })
  oracleConfig: OracleConfig;

  // Resolution Engine V1
  @Prop({ type: ResolutionConfig })
  resolution: ResolutionConfig;

  // Voting System V2
  @Prop({ type: Object })
  voting?: {
    enabled: boolean;
    status: 'idle' | 'active' | 'finished';
    startedAt?: Date;
    endsAt?: Date;
    result?: 'yes' | 'no' | 'invalid';
    totalVotes?: number;
    yesVotes?: number;
    noVotes?: number;
    requiredRole?: 'nft_holder' | 'any';
    durationHours?: number;
  };

  // Dispute info
  @Prop()
  disputeReason?: string;

  @Prop()
  disputedAt?: Date;

  @Prop()
  disputedBy?: string;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);
export const ResolutionConfigSchema = SchemaFactory.createForClass(ResolutionConfig);

// Indexes
PredictionSchema.index({ status: 1 });
PredictionSchema.index({ category: 1 });
PredictionSchema.index({ closeTime: 1 });
PredictionSchema.index({ createdBy: 1 });
PredictionSchema.index({ 'chain.marketId': 1 });
PredictionSchema.index({ 'resolution.status': 1 });
PredictionSchema.index({ 'resolution.mode': 1 });
PredictionSchema.index({ 'voting.status': 1 });
PredictionSchema.index({ 'voting.endsAt': 1 });
