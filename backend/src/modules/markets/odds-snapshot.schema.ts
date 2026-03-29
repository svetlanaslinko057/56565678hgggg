import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OddsSnapshotDocument = OddsSnapshot & Document;

/**
 * BLOCK 3: Odds History Schema
 * Stores historical odds data for charting
 */
@Schema({ timestamps: true, collection: 'odds_snapshots' })
export class OddsSnapshot {
  @Prop({ required: true, index: true })
  marketId: string;

  @Prop({ required: true })
  outcomeId: string;

  @Prop({ required: true })
  outcomeLabel: string;

  @Prop({ required: true })
  price: number; // 0.0 - 1.0 (probability)

  @Prop({ required: true })
  odds: number; // multiplier

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;

  @Prop()
  totalStake: number;

  @Prop()
  volume24h: number;
}

export const OddsSnapshotSchema = SchemaFactory.createForClass(OddsSnapshot);

// Compound index for efficient queries
OddsSnapshotSchema.index({ marketId: 1, timestamp: -1 });
OddsSnapshotSchema.index({ marketId: 1, outcomeId: 1, timestamp: -1 });
