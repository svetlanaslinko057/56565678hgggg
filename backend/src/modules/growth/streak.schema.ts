import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserStreakDocument = UserStreak & Document;

@Schema({ timestamps: true })
export class UserStreak {
  @Prop({ required: true, unique: true, lowercase: true })
  wallet: string;

  // Current streak
  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  bestStreak: number;

  @Prop()
  lastWinAt?: Date;

  @Prop()
  lastLossAt?: Date;

  // Streak badges earned
  @Prop({ type: [String], default: [] })
  badges: string[];

  // Stats
  @Prop({ default: 0 })
  totalWins: number;

  @Prop({ default: 0 })
  totalLosses: number;

  @Prop({ default: 0 })
  totalPredictions: number;
}

export const UserStreakSchema = SchemaFactory.createForClass(UserStreak);

UserStreakSchema.index({ wallet: 1 });
UserStreakSchema.index({ currentStreak: -1 });
UserStreakSchema.index({ bestStreak: -1 });
