import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PositionDocument = Position & Document;

export enum PositionStatus {
  OPEN = 'open',
  LISTED = 'listed',
  SOLD = 'sold',
  WON = 'won',
  LOST = 'lost',
  CLAIMED = 'claimed',
}

@Schema({ _id: false })
export class NFTData {
  @Prop()
  tokenId: string;

  @Prop()
  contract: string;

  @Prop()
  chainId: number;

  @Prop()
  txHash: string;
}

@Schema({ timestamps: true })
export class Position {
  @Prop({ required: true, index: true })
  marketId: string;

  @Prop({ required: true })
  predictionId: string;

  @Prop({ required: true })
  outcomeId: string;

  @Prop({ required: true })
  outcomeLabel: string;

  @Prop({ required: true })
  stake: number;

  @Prop({ required: true })
  odds: number;

  @Prop({ required: true })
  fee: number;

  @Prop({ required: true })
  potentialReturn: number;

  @Prop({ required: true, lowercase: true, index: true })
  wallet: string;

  @Prop({ type: NFTData })
  nft: NFTData;

  @Prop({ type: String, enum: PositionStatus, default: PositionStatus.OPEN, index: true })
  status: PositionStatus;

  @Prop()
  payout: number;

  @Prop()
  profit: number;

  @Prop()
  resolvedAt: Date;

  @Prop()
  claimedAt: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

// Compound indexes
PositionSchema.index({ wallet: 1, status: 1 });
PositionSchema.index({ marketId: 1, wallet: 1 });
PositionSchema.index({ 'nft.tokenId': 1 }, { sparse: true });
