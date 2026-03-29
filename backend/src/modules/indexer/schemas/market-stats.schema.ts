import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketStatsDocument = MarketStats & Document;

@Schema({ timestamps: true })
export class MarketStats {
  @Prop({ required: true, unique: true })
  marketId: string;

  @Prop({ default: '0' })
  totalVolume: string;

  @Prop({ default: 0 })
  participantsCount: number;

  @Prop({ default: 0 })
  totalBets: number;

  @Prop({ type: [String], default: [] })
  participants: string[]; // Unique wallet addresses

  @Prop()
  lastActivityAt: Date;

  @Prop({ type: Object, default: {} })
  outcomePools: Record<string, string>; // outcomeId => pool amount
}

export const MarketStatsSchema = SchemaFactory.createForClass(MarketStats);
