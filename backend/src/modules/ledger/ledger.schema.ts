import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LedgerEntryDocument = LedgerEntry & Document;

export enum LedgerType {
  BET_STAKE = 'bet_stake',
  FEE = 'fee',
  PAYOUT = 'payout',
  REFUND = 'refund',
  DEMO_CREDIT = 'demo_credit',
  LISTING_SALE = 'listing_sale',
  LISTING_PURCHASE = 'listing_purchase',
  // Market creation stake
  STAKE_LOCK = 'stake_lock',
  STAKE_RETURN = 'stake_return',
  STAKE_BURN = 'stake_burn',
}

@Schema({ timestamps: true })
export class LedgerEntry {
  @Prop({ required: true, index: true })
  wallet: string;

  @Prop()
  demoId: string;

  @Prop({ type: String, enum: LedgerType, required: true })
  type: LedgerType;

  @Prop({ required: true })
  amount: number;

  @Prop()
  balanceBefore: number;

  @Prop()
  balanceAfter: number;

  @Prop()
  ref: string; // positionId, marketId, listingId

  @Prop()
  description: string;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);

// Indexes
LedgerEntrySchema.index({ wallet: 1, createdAt: -1 });
LedgerEntrySchema.index({ demoId: 1, createdAt: -1 });
LedgerEntrySchema.index({ ref: 1 });
