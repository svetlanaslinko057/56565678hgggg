import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ListingDocument = Listing & Document;

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELED = 'canceled',
}

@Schema({ timestamps: true })
export class Listing {
  @Prop({ required: true, index: true })
  positionId: string;

  @Prop()
  tokenId: string;

  @Prop()
  contract: string;

  @Prop({ required: true, lowercase: true, index: true })
  sellerWallet: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: String, enum: ListingStatus, default: ListingStatus.ACTIVE, index: true })
  status: ListingStatus;

  @Prop()
  buyerWallet: string;

  @Prop()
  soldAt: Date;

  @Prop()
  canceledAt: Date;

  // Position snapshot
  @Prop()
  marketId: string;

  @Prop()
  outcomeLabel: string;

  @Prop()
  stake: number;

  @Prop()
  odds: number;

  @Prop()
  potentialReturn: number;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// Indexes
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ marketId: 1, status: 1 });
