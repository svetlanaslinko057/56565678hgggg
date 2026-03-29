import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DuelDocument = Duel & Document;

export enum DuelStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  FINISHED = 'finished',
  CANCELED = 'canceled',
}

@Schema({ timestamps: true })
export class Duel {
  @Prop({ required: true })
  marketId: string;

  @Prop()
  predictionId: string;

  @Prop({ required: true })
  creatorWallet: string;

  @Prop()
  opponentWallet: string;

  @Prop({ required: true, enum: ['yes', 'no'] })
  creatorSide: string;

  @Prop({ enum: ['yes', 'no'] })
  opponentSide: string;

  @Prop({ required: true })
  stakeAmount: number;

  @Prop({ default: 0 })
  totalPot: number;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: String, enum: DuelStatus, default: DuelStatus.PENDING })
  status: DuelStatus;

  @Prop()
  winnerWallet: string;

  @Prop()
  resolvedAt: Date;

  @Prop()
  predictionTitle: string;
}

export const DuelSchema = SchemaFactory.createForClass(Duel);

// Indexes
DuelSchema.index({ status: 1 });
DuelSchema.index({ creatorWallet: 1 });
DuelSchema.index({ opponentWallet: 1 });
DuelSchema.index({ marketId: 1 });
DuelSchema.index({ expiresAt: 1 });
