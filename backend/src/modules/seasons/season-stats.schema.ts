import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeasonStatsDocument = SeasonStats & Document;

@Schema({ timestamps: true })
export class SeasonStats {
  @Prop({ required: true, index: true })
  seasonId: string;

  @Prop({ required: true, index: true })
  wallet: string;

  @Prop({ default: 0 })
  leaguePoints: number;

  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  accuracy: number;

  @Prop({ default: 0 })
  predictions: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  totalStake: number;

  @Prop({ default: 0 })
  totalProfit: number;

  @Prop({ default: 0 })
  duelWins: number;

  @Prop({ default: 0 })
  duelLosses: number;

  @Prop({ default: 0 })
  duelWinnings: number;

  @Prop({ default: 0 })
  rank: number;

  @Prop()
  lastUpdated: Date;
}

export const SeasonStatsSchema = SchemaFactory.createForClass(SeasonStats);

// Compound index for unique season+wallet combination
SeasonStatsSchema.index({ seasonId: 1, wallet: 1 }, { unique: true });
SeasonStatsSchema.index({ seasonId: 1, leaguePoints: -1 });
SeasonStatsSchema.index({ seasonId: 1, roi: -1 });
SeasonStatsSchema.index({ seasonId: 1, rank: 1 });
