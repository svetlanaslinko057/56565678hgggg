import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PositionSnapshotDocument = PositionSnapshot & Document;

@Schema({ timestamps: true })
export class PositionSnapshot {
  @Prop({ required: true })
  wallet: string;

  @Prop({ required: true })
  marketId: string;

  @Prop({ required: true })
  outcomeId: number;

  @Prop({ required: true })
  tokenId: string;

  @Prop({ default: '0' })
  balance: string;
}

export const PositionSnapshotSchema = SchemaFactory.createForClass(PositionSnapshot);

// Compound index for unique positions
PositionSnapshotSchema.index({ wallet: 1, marketId: 1, outcomeId: 1 }, { unique: true });
PositionSnapshotSchema.index({ wallet: 1 });
PositionSnapshotSchema.index({ marketId: 1 });
