import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OddsSnapshotDocument = OddsSnapshot & Document;

@Schema({ timestamps: true, collection: 'odds_snapshots' })
export class OddsSnapshot {
  @Prop({ required: true, index: true })
  marketId: string;

  @Prop({ required: true })
  outcome: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  volume: number;

  @Prop({ required: true, index: true })
  timestamp: Date;
}

export const OddsSnapshotSchema = SchemaFactory.createForClass(OddsSnapshot);

// Compound index for efficient queries
OddsSnapshotSchema.index({ marketId: 1, timestamp: -1 });
