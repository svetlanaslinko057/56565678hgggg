import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketLiquidityDocument = MarketLiquidity & Document;

@Schema({ _id: false })
export class OutcomePool {
  @Prop({ required: true })
  outcomeId: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 0 })
  stake: number;

  @Prop({ default: 0 })
  betsCount: number;
}

@Schema({ timestamps: true })
export class MarketLiquidity {
  @Prop({ required: true, unique: true, index: true })
  marketId: string;

  @Prop({ default: 300 })
  feeBps: number;

  @Prop({ type: [OutcomePool], default: [] })
  pools: OutcomePool[];

  @Prop({ default: 0 })
  totalStake: number;

  @Prop({ default: 0 })
  totalBets: number;

  @Prop({ default: 50 })
  smoothingK: number; // Smoothing factor for odds calculation
}

export const MarketLiquiditySchema = SchemaFactory.createForClass(MarketLiquidity);
