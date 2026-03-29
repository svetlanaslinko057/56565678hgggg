import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShareLinkDocument = ShareLink & Document;

@Schema({ timestamps: true, collection: 'sharelinks' })
export class ShareLink {
  @Prop({ required: true, unique: true, index: true })
  shareId: string;

  @Prop({ required: true })
  positionId: string;

  @Prop({ required: true })
  marketId: string;

  @Prop({ required: true })
  createdByWallet: string;

  @Prop()
  refWallet?: string;

  @Prop({ required: true })
  hmacSignature: string;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop({ default: 0 })
  conversionCount: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ShareLinkSchema = SchemaFactory.createForClass(ShareLink);

// Indexes
ShareLinkSchema.index({ createdByWallet: 1 });
ShareLinkSchema.index({ positionId: 1 });
ShareLinkSchema.index({ createdAt: -1 });
