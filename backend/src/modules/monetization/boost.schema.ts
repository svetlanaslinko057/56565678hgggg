import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BoostDocument = Boost & Document;

export enum BoostType {
  BET = 'bet',
  DUEL = 'duel',
  MARKET = 'market',
}

export enum BoostStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED = 'used',
}

@Schema({ timestamps: true })
export class Boost {
  @Prop({ required: true, enum: BoostType })
  type: BoostType;

  @Prop({ required: true })
  targetId: string; // betId, duelId, or marketId

  @Prop({ required: true })
  wallet: string;

  @Prop({ required: true })
  amount: number; // Amount paid for boost

  @Prop({ type: String, enum: BoostStatus, default: BoostStatus.ACTIVE })
  status: BoostStatus;

  @Prop()
  expiresAt: Date;

  @Prop({ default: false })
  featured: boolean; // For featured duels/markets

  @Prop()
  txHash?: string; // On-chain transaction hash
}

export const BoostSchema = SchemaFactory.createForClass(Boost);

// Indexes
BoostSchema.index({ type: 1, targetId: 1 });
BoostSchema.index({ wallet: 1 });
BoostSchema.index({ status: 1, expiresAt: 1 });
BoostSchema.index({ type: 1, status: 1, featured: 1 });
