import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  DUEL_REQUEST = 'duel_request',
  DUEL_ACCEPTED = 'duel_accepted',
  DUEL_DECLINED = 'duel_declined',
  DUEL_RESULT = 'duel_result',
  PREDICTION_WON = 'prediction_won',
  PREDICTION_LOST = 'prediction_lost',
  XP_EARNED = 'xp_earned',
  MARKET_SUBMITTED = 'market_submitted',
  MARKET_APPROVED = 'market_approved',
  MARKET_REJECTED = 'market_rejected',
  POSITION_CREATED = 'position_created',
  POSITION_WON = 'position_won',
  POSITION_LOST = 'position_lost',
  POSITION_CLAIMED = 'position_claimed',
  BET_PLACED = 'bet_placed',
  LEVEL_UP = 'level_up',
}

export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface NotificationAction {
  type: string;
  label: string;
  data?: Record<string, any>;
}

export interface NotificationPayload {
  duelId?: string;
  marketId?: string | number;
  predictionId?: string;
  stake?: number;
  winnings?: number;
  xpAmount?: number;
  outcome?: string;
  opponentWallet?: string;
  challengerWallet?: string;
  [key: string]: any;
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, index: true })
  userWallet: string;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  payload: NotificationPayload;

  @Prop({ type: Array, default: [] })
  actions: NotificationAction[];

  @Prop({ type: String, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for efficient queries
NotificationSchema.index({ userWallet: 1, read: 1 });
NotificationSchema.index({ userWallet: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
