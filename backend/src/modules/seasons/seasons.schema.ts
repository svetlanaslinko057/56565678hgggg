import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeasonDocument = Season & Document;

export enum SeasonStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Season {
  @Prop({ required: true, unique: true })
  seasonId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: SeasonStatus, default: SeasonStatus.UPCOMING })
  status: SeasonStatus;

  @Prop({ type: Object, default: {} })
  rewards: {
    top10?: string;
    top50?: string;
    top5Percent?: string;
  };

  @Prop({ default: 0 })
  totalParticipants: number;

  @Prop({ default: 0 })
  totalPredictions: number;

  @Prop({ default: 0 })
  totalVolume: number;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);

SeasonSchema.index({ status: 1 });
SeasonSchema.index({ startDate: 1, endDate: 1 });
