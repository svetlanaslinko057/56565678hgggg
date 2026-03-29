import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketMirrorDocument = MarketMirror & Document;

@Schema({ collection: 'marketmirrors', timestamps: true })
export class MarketMirror {
  @Prop({ required: true, unique: true, index: true })
  chainMarketId: number;

  @Prop({ required: true, index: true })
  externalMarketId: string;

  @Prop({ required: true })
  closeTime: Date;

  @Prop({ required: true })
  outcomeCount: number;

  @Prop({ default: 0 })
  winningOutcome: number;

  @Prop({ 
    type: String, 
    enum: ['NONE', 'OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'],
    default: 'OPEN'
  })
  status: string;

  @Prop({ default: '0' })
  totalDeposited: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: true })
  blockNumber: number;
}

export const MarketMirrorSchema = SchemaFactory.createForClass(MarketMirror);


export type PositionMirrorDocument = PositionMirror & Document;

@Schema({ collection: 'positionmirrors', timestamps: true })
export class PositionMirror {
  @Prop({ required: true, unique: true, index: true })
  tokenId: number;

  @Prop({ required: true, index: true })
  chainMarketId: number;

  @Prop({ required: true, index: true })
  owner: string;

  @Prop({ required: true })
  outcomeId: number;

  @Prop({ required: true })
  stake: string;

  @Prop({ required: true })
  shares: string;

  @Prop({ default: false })
  claimed: boolean;

  @Prop({ default: false })
  refunded: boolean;

  @Prop()
  claimPayout?: string;

  @Prop()
  claimFee?: string;

  @Prop({ required: true })
  mintTxHash: string;

  @Prop()
  claimTxHash?: string;

  @Prop()
  refundTxHash?: string;

  @Prop({ required: true })
  mintBlockNumber: number;
}

export const PositionMirrorSchema = SchemaFactory.createForClass(PositionMirror);


export type ActivityEventDocument = ActivityEvent & Document;

@Schema({ collection: 'activityevents', timestamps: true })
export class ActivityEvent {
  @Prop({ 
    required: true, 
    index: true,
    enum: ['BET_PLACED', 'MARKET_CREATED', 'MARKET_RESOLVED', 'MARKET_CANCELLED', 'POSITION_CLAIMED', 'POSITION_REFUNDED', 'POSITION_TRANSFERRED']
  })
  eventType: string;

  @Prop({ index: true })
  chainMarketId?: number;

  @Prop({ index: true })
  tokenId?: number;

  @Prop({ required: true, index: true })
  wallet: string;

  @Prop()
  amount?: string;

  @Prop({ required: true, index: true })
  txHash: string;

  @Prop({ required: true })
  logIndex: number;

  @Prop({ required: true, index: true })
  blockNumber: number;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);
ActivityEventSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });
