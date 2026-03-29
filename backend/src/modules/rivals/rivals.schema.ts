import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RivalryDocument = Rivalry & Document;

/**
 * Rivalry Schema
 * Tracks head-to-head stats between two wallets
 * 
 * Key: sorted(walletA, walletB) - ensures no duplicate pairs
 */
@Schema({ timestamps: true })
export class Rivalry {
  @Prop({ required: true, lowercase: true, index: true })
  walletA: string;

  @Prop({ required: true, lowercase: true, index: true })
  walletB: string;

  @Prop({ default: 0 })
  totalDuels: number;

  @Prop({ default: 0 })
  winsA: number;

  @Prop({ default: 0 })
  winsB: number;

  @Prop({ type: [String], default: [] })
  duelIds: string[];

  @Prop({ lowercase: true })
  lastWinner?: string;

  @Prop({ lowercase: true })
  lastLoser?: string;

  @Prop()
  lastDuelAt?: Date;

  @Prop({ lowercase: true })
  currentStreakWallet?: string;

  @Prop({ default: 0 })
  currentStreakCount: number;

  @Prop({ default: 0 })
  lastStake: number;
}

export const RivalrySchema = SchemaFactory.createForClass(Rivalry);

// Compound unique index to prevent duplicate pairs
RivalrySchema.index({ walletA: 1, walletB: 1 }, { unique: true });

// Index for efficient lookups by either wallet
RivalrySchema.index({ walletA: 1 });
RivalrySchema.index({ walletB: 1 });
