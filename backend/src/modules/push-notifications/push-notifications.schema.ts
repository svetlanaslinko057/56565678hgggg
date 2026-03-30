import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserSubscriptionsDocument = UserSubscriptions & Document;

/**
 * User Subscriptions Schema
 * Tracks what markets/rivals a user is watching for push notifications
 */
@Schema({ _id: false })
export class SubscriptionSettings {
  @Prop({ default: true })
  edgeAlerts: boolean;

  @Prop({ default: true })
  whaleAlerts: boolean;

  @Prop({ default: true })
  closingAlerts: boolean;

  @Prop({ default: true })
  winAlerts: boolean;

  @Prop({ default: true })
  rivalAlerts: boolean;

  @Prop({ default: 5 })
  maxDailyNotifications: number;

  @Prop({ default: 10 })
  edgeThreshold: number; // % edge jump to trigger

  @Prop({ default: 100 })
  whaleThreshold: number; // $ amount to trigger whale alert
}

@Schema({ timestamps: true, collection: 'user_subscriptions' })
export class UserSubscriptions {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  wallet: string;

  @Prop({ type: String, index: true })
  telegramId: string;

  @Prop({ type: [String], default: [] })
  watchlistMarkets: string[]; // Market IDs user is watching

  @Prop({ type: [String], default: [] })
  watchlistRivals: string[]; // Rival wallet addresses

  @Prop({ type: SubscriptionSettings, default: {} })
  settings: SubscriptionSettings;

  @Prop({ default: 0 })
  notificationsSentToday: number;

  @Prop({ type: Date })
  lastNotificationReset: Date;

  @Prop({ type: Date })
  lastNotificationSent: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSubscriptionsSchema = SchemaFactory.createForClass(UserSubscriptions);

/**
 * Push Notification Log Schema
 * Tracks all sent notifications for analytics and rate limiting
 */
export type PushNotificationLogDocument = PushNotificationLog & Document;

export enum PushNotificationType {
  EDGE_ALERT = 'edge_alert',
  WHALE_BET = 'whale_bet',
  CLOSING_SOON = 'closing_soon',
  WIN = 'win',
  RIVAL_CHALLENGE = 'rival_challenge',
  RIVAL_BEAT = 'rival_beat',
  WEEKLY_PRESSURE = 'weekly_pressure',
  ACTIVITY_SPIKE = 'activity_spike',
}

@Schema({ timestamps: true, collection: 'push_notification_logs' })
export class PushNotificationLog {
  @Prop({ required: true, lowercase: true, index: true })
  wallet: string;

  @Prop({ type: String, index: true })
  telegramId: string;

  @Prop({ type: String, enum: PushNotificationType, required: true })
  type: PushNotificationType;

  @Prop()
  marketId: string;

  @Prop()
  message: string;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ default: false })
  clicked: boolean;

  @Prop({ type: Date })
  clickedAt: Date;

  @Prop({ default: false })
  delivered: boolean;

  @Prop()
  error: string;
}

export const PushNotificationLogSchema = SchemaFactory.createForClass(PushNotificationLog);

// Indexes
PushNotificationLogSchema.index({ createdAt: -1 });
PushNotificationLogSchema.index({ wallet: 1, type: 1, createdAt: -1 });
