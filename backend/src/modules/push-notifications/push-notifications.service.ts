import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Markup } from 'telegraf';
import { 
  UserSubscriptions, 
  UserSubscriptionsDocument,
  PushNotificationLog,
  PushNotificationLogDocument,
  PushNotificationType,
} from './push-notifications.schema';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import { FomoEvent } from '../fomo-engine/fomo-engine.service';

interface PushPayload {
  wallet: string;
  telegramId?: string;
  type: PushNotificationType;
  marketId?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  deepLink?: string;
  buttons?: Array<{ text: string; url: string }>;
}

/**
 * Push Notification Service
 * 
 * Handles Telegram push notifications with:
 * - Rate limiting (max 3-5 per day)
 * - Auto triggers (edge, whale, closing)
 * - User subscriptions (watchlist)
 * - Deep links to Mini App
 * - Click tracking
 */
@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly webAppUrl: string;
  private readonly botUsername: string;

  constructor(
    @InjectModel(UserSubscriptions.name)
    private subscriptionsModel: Model<UserSubscriptionsDocument>,
    @InjectModel(PushNotificationLog.name)
    private logModel: Model<PushNotificationLogDocument>,
    @InjectConnection() private connection: Connection,
    private eventEmitter: EventEmitter2,
    private telegramBot: TelegramBotService,
  ) {
    this.webAppUrl = process.env.FRONTEND_URL || 'https://repo-setup-54.preview.emergentagent.com';
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'fomo_arena_bot';
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Get or create user subscriptions
   */
  async getSubscriptions(wallet: string): Promise<UserSubscriptionsDocument> {
    let sub = await this.subscriptionsModel.findOne({ wallet: wallet.toLowerCase() });
    
    if (!sub) {
      // Get telegramId from users collection
      const user = await this.connection.collection('arenausers').findOne({ 
        wallet: wallet.toLowerCase() 
      });
      
      sub = await this.subscriptionsModel.create({
        wallet: wallet.toLowerCase(),
        telegramId: user?.telegramId,
        settings: {
          edgeAlerts: true,
          whaleAlerts: true,
          closingAlerts: true,
          winAlerts: true,
          rivalAlerts: true,
          maxDailyNotifications: 5,
          edgeThreshold: 10,
          whaleThreshold: 100,
        },
        lastNotificationReset: new Date(),
      });
    }
    
    return sub;
  }

  /**
   * Add market to watchlist
   */
  async watchMarket(wallet: string, marketId: string): Promise<void> {
    await this.subscriptionsModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { 
        $addToSet: { watchlistMarkets: marketId },
        $setOnInsert: { 
          wallet: wallet.toLowerCase(),
          settings: {},
          lastNotificationReset: new Date(),
        },
      },
      { upsert: true }
    );
    this.logger.log(`${wallet} watching market ${marketId}`);
  }

  /**
   * Remove market from watchlist
   */
  async unwatchMarket(wallet: string, marketId: string): Promise<void> {
    await this.subscriptionsModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $pull: { watchlistMarkets: marketId } }
    );
  }

  /**
   * Add rival to watchlist
   */
  async watchRival(wallet: string, rivalWallet: string): Promise<void> {
    await this.subscriptionsModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { 
        $addToSet: { watchlistRivals: rivalWallet.toLowerCase() },
        $setOnInsert: { 
          wallet: wallet.toLowerCase(),
          settings: {},
          lastNotificationReset: new Date(),
        },
      },
      { upsert: true }
    );
    this.logger.log(`${wallet} watching rival ${rivalWallet}`);
  }

  /**
   * Update notification settings
   */
  async updateSettings(
    wallet: string, 
    settings: Partial<UserSubscriptions['settings']>
  ): Promise<void> {
    await this.subscriptionsModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { $set: { settings } },
      { upsert: true }
    );
  }

  /**
   * Link Telegram ID to wallet
   */
  async linkTelegram(wallet: string, telegramId: string): Promise<void> {
    await this.subscriptionsModel.updateOne(
      { wallet: wallet.toLowerCase() },
      { 
        $set: { telegramId },
        $setOnInsert: { 
          wallet: wallet.toLowerCase(),
          settings: {},
          lastNotificationReset: new Date(),
        },
      },
      { upsert: true }
    );
    this.logger.log(`Linked ${wallet} to Telegram ${telegramId}`);
  }

  // ==================== PUSH NOTIFICATION SENDING ====================

  /**
   * Send push notification with rate limiting
   */
  async sendPush(payload: PushPayload): Promise<boolean> {
    const { wallet, type, marketId, title, message, data, deepLink, buttons } = payload;
    
    // Get subscription
    const sub = await this.getSubscriptions(wallet);
    
    // Check if user has Telegram linked
    if (!sub.telegramId) {
      this.logger.debug(`No Telegram ID for ${wallet}, skipping push`);
      return false;
    }

    // Check rate limit
    if (!await this.checkRateLimit(sub)) {
      this.logger.debug(`Rate limit reached for ${wallet}`);
      return false;
    }

    // Check if user has this notification type enabled
    if (!this.isNotificationEnabled(sub, type)) {
      this.logger.debug(`${type} notifications disabled for ${wallet}`);
      return false;
    }

    // Build deep link
    const link = deepLink || this.buildDeepLink(type, marketId, data);
    
    // Build message with markdown
    const fullMessage = `*${title}*\n\n${message}`;
    
    // Build keyboard
    const keyboard = buttons?.length 
      ? Markup.inlineKeyboard(
          buttons.map(b => [Markup.button.webApp(b.text, b.url)])
        )
      : Markup.inlineKeyboard([
          [Markup.button.webApp('🎯 Open Arena', link)],
        ]);

    // Send via Telegram
    try {
      await this.telegramBot.sendNotification(sub.telegramId, fullMessage, keyboard);
      
      // Log notification
      await this.logModel.create({
        wallet: wallet.toLowerCase(),
        telegramId: sub.telegramId,
        type,
        marketId,
        message: fullMessage,
        data,
        delivered: true,
      });

      // Increment counter
      await this.subscriptionsModel.updateOne(
        { wallet: wallet.toLowerCase() },
        { 
          $inc: { notificationsSentToday: 1 },
          $set: { lastNotificationSent: new Date() },
        }
      );

      this.logger.log(`Push sent to ${wallet}: ${type}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push to ${wallet}:`, error);
      
      await this.logModel.create({
        wallet: wallet.toLowerCase(),
        telegramId: sub.telegramId,
        type,
        marketId,
        message: fullMessage,
        data,
        delivered: false,
        error: error.message,
      });
      
      return false;
    }
  }

  /**
   * Check if user is within rate limit
   */
  private async checkRateLimit(sub: UserSubscriptionsDocument): Promise<boolean> {
    // Reset counter if new day
    const now = new Date();
    const lastReset = sub.lastNotificationReset;
    
    if (!lastReset || now.getDate() !== lastReset.getDate()) {
      await this.subscriptionsModel.updateOne(
        { _id: sub._id },
        { 
          $set: { 
            notificationsSentToday: 0,
            lastNotificationReset: now,
          },
        }
      );
      sub.notificationsSentToday = 0;
    }

    return sub.notificationsSentToday < sub.settings.maxDailyNotifications;
  }

  /**
   * Check if notification type is enabled
   */
  private isNotificationEnabled(sub: UserSubscriptionsDocument, type: PushNotificationType): boolean {
    switch (type) {
      case PushNotificationType.EDGE_ALERT:
        return sub.settings.edgeAlerts;
      case PushNotificationType.WHALE_BET:
        return sub.settings.whaleAlerts;
      case PushNotificationType.CLOSING_SOON:
        return sub.settings.closingAlerts;
      case PushNotificationType.WIN:
        return sub.settings.winAlerts;
      case PushNotificationType.RIVAL_CHALLENGE:
      case PushNotificationType.RIVAL_BEAT:
        return sub.settings.rivalAlerts;
      default:
        return true;
    }
  }

  /**
   * Build deep link for Mini App
   */
  private buildDeepLink(type: PushNotificationType, marketId?: string, data?: any): string {
    const baseUrl = `${this.webAppUrl}/tg`;
    
    switch (type) {
      case PushNotificationType.EDGE_ALERT:
      case PushNotificationType.WHALE_BET:
      case PushNotificationType.CLOSING_SOON:
      case PushNotificationType.ACTIVITY_SPIKE:
        return marketId ? `${baseUrl}?startapp=market_${marketId}` : baseUrl;
      
      case PushNotificationType.WIN:
        return `${baseUrl}?tab=positions&claim=${marketId}`;
      
      case PushNotificationType.RIVAL_CHALLENGE:
      case PushNotificationType.RIVAL_BEAT:
        return `${baseUrl}?tab=duels&rival=${data?.rivalWallet || ''}`;
      
      case PushNotificationType.WEEKLY_PRESSURE:
        return `${baseUrl}?tab=leagues`;
      
      default:
        return baseUrl;
    }
  }

  // ==================== AUTO TRIGGERS ====================

  /**
   * Handle FOMO events from FOMO Engine
   */
  @OnEvent('fomo.event')
  async handleFomoEvent(event: FomoEvent): Promise<void> {
    this.logger.log(`Processing FOMO event: ${event.type} for market ${event.marketId}`);

    // Get all users watching this market
    const watchers = await this.subscriptionsModel.find({
      watchlistMarkets: event.marketId,
      isActive: true,
    });

    if (watchers.length === 0) {
      this.logger.debug(`No watchers for market ${event.marketId}`);
      return;
    }

    // Send to all watchers based on event type
    for (const watcher of watchers) {
      await this.processFomoEventForUser(watcher, event);
    }
  }

  private async processFomoEventForUser(
    sub: UserSubscriptionsDocument, 
    event: FomoEvent
  ): Promise<void> {
    let type: PushNotificationType;
    let title: string;
    let message: string;
    let buttons: Array<{ text: string; url: string }> = [];

    const deepLink = `${this.webAppUrl}/tg?startapp=market_${event.marketId}`;

    switch (event.type) {
      case 'EDGE_JUMP':
        if ((event.data.edgeDelta || 0) < sub.settings.edgeThreshold) return;
        type = PushNotificationType.EDGE_ALERT;
        title = '⚡ Edge Alert!';
        message = `${event.marketTitle || 'Market'}\n\nEdge: *+${event.data.edge?.toFixed(1)}%*\n${event.message}`;
        buttons = [{ text: '🎯 Bet Now', url: deepLink }];
        break;

      case 'WHALE_AGREEMENT':
        if ((event.data.whaleAmount || 0) < sub.settings.whaleThreshold) return;
        type = PushNotificationType.WHALE_BET;
        title = '🐋 Whale Activity!';
        message = `${event.marketTitle || 'Market'}\n\n*$${event.data.whaleAmount}* bet on ${event.data.aiSide}\nAI agrees (${Math.round((event.data.aiConfidence || 0) * 100)}%)`;
        buttons = [{ text: '🐋 Follow Whale', url: deepLink }];
        break;

      case 'CLOSING_SOON':
        type = PushNotificationType.CLOSING_SOON;
        title = '⏰ Closing Soon!';
        message = `${event.marketTitle || 'Market'}\n\n⏱ Closing in ${event.data.closingIn}m\n🔥 ${event.data.betsLastMinutes} bets last 5 min`;
        buttons = [{ text: '⏰ Bet Before Close', url: deepLink }];
        break;

      case 'SOCIAL_SPIKE':
        type = PushNotificationType.ACTIVITY_SPIKE;
        title = '🔥 Hot Market!';
        message = `${event.marketTitle || 'Market'}\n\n${event.data.betsLastMinutes} people betting right now!`;
        buttons = [{ text: '🔥 Join Action', url: deepLink }];
        break;

      case 'AI_CONFIDENCE':
        type = PushNotificationType.EDGE_ALERT;
        title = '🤖 AI Signal';
        message = `${event.marketTitle || 'Market'}\n\nAI: *${Math.round((event.data.aiConfidence || 0) * 100)}% ${event.data.aiSide}*\nEdge: +${event.data.edge?.toFixed(1)}%`;
        buttons = [{ text: '🎯 Bet Now', url: deepLink }];
        break;

      default:
        return;
    }

    await this.sendPush({
      wallet: sub.wallet,
      telegramId: sub.telegramId,
      type,
      marketId: event.marketId,
      title,
      message,
      data: event.data,
      buttons,
    });
  }

  // ==================== SPECIFIC PUSH TYPES ====================

  /**
   * Send win notification
   */
  async sendWinPush(
    wallet: string, 
    amount: number, 
    marketTitle: string, 
    marketId: string,
    streak?: number
  ): Promise<void> {
    const deepLink = `${this.webAppUrl}/tg?tab=positions&claim=${marketId}`;
    
    let message = `💰 *+$${amount.toFixed(2)}*\n\nMarket: ${marketTitle.substring(0, 50)}...`;
    if (streak && streak >= 3) {
      message += `\n\n🔥 ${streak} win streak!`;
    }

    await this.sendPush({
      wallet,
      type: PushNotificationType.WIN,
      marketId,
      title: '🎉 You Won!',
      message,
      data: { amount, streak },
      buttons: [
        { text: '💰 Claim', url: deepLink },
        { text: '📤 Share Win', url: `${this.webAppUrl}/tg?share=win&market=${marketId}` },
      ],
    });
  }

  /**
   * Send rival challenge notification
   */
  async sendRivalChallengePush(
    wallet: string,
    challengerName: string,
    duelId: string,
    stake: number
  ): Promise<void> {
    const deepLink = `${this.webAppUrl}/tg?startapp=duel_${duelId}`;
    
    await this.sendPush({
      wallet,
      type: PushNotificationType.RIVAL_CHALLENGE,
      title: '⚔️ Duel Challenge!',
      message: `*${challengerName}* challenged you!\n\n💰 Stake: $${stake}\n🏆 Pot: $${stake * 2}`,
      data: { challengerName, duelId, stake },
      buttons: [{ text: '⚔️ Accept Duel', url: deepLink }],
    });
  }

  /**
   * Send rival beat notification (when rival loses to you)
   */
  async sendRivalBeatPush(
    wallet: string,
    rivalName: string,
    winnings: number,
    streak: number
  ): Promise<void> {
    await this.sendPush({
      wallet,
      type: PushNotificationType.RIVAL_BEAT,
      title: '🏆 Rival Defeated!',
      message: `You beat *${rivalName}*!\n\n💰 +$${winnings.toFixed(2)}\n🔥 ${streak}-win streak against them`,
      data: { rivalName, winnings, streak },
      buttons: [{ text: '📤 Flex Win', url: `${this.webAppUrl}/tg?tab=profile` }],
    });
  }

  /**
   * Send weekly pressure notification
   */
  async sendWeeklyPressurePush(
    wallet: string,
    rank: number,
    hoursLeft: number
  ): Promise<void> {
    const inTop10 = rank <= 10;
    const message = inTop10 
      ? `You're *#${rank}* with ${hoursLeft}h left!\n\n🔥 You're in Top 10!`
      : `You're *#${rank}* with ${hoursLeft}h left!\n\nJust ${rank - 10} spots from Top 10!`;

    await this.sendPush({
      wallet,
      type: PushNotificationType.WEEKLY_PRESSURE,
      title: '🏆 Weekly Competition',
      message,
      data: { rank, hoursLeft },
      buttons: [{ text: '🏆 View Leaderboard', url: `${this.webAppUrl}/tg?tab=leagues` }],
    });
  }

  // ==================== TRACKING ====================

  /**
   * Track notification click
   */
  async trackClick(notificationId: string): Promise<void> {
    await this.logModel.updateOne(
      { _id: notificationId },
      { $set: { clicked: true, clickedAt: new Date() } }
    );
  }

  /**
   * Get notification stats for user
   */
  async getStats(wallet: string): Promise<{
    sent: number;
    clicked: number;
    clickRate: number;
  }> {
    const sent = await this.logModel.countDocuments({ 
      wallet: wallet.toLowerCase(), 
      delivered: true 
    });
    const clicked = await this.logModel.countDocuments({ 
      wallet: wallet.toLowerCase(), 
      clicked: true 
    });
    
    return {
      sent,
      clicked,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    };
  }

  // ==================== CLEANUP ====================

  /**
   * Reset daily notification counters at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters(): Promise<void> {
    await this.subscriptionsModel.updateMany(
      {},
      { 
        $set: { 
          notificationsSentToday: 0,
          lastNotificationReset: new Date(),
        },
      }
    );
    this.logger.log('Daily notification counters reset');
  }

  /**
   * Cleanup old notification logs (keep 30 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.logModel.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });

    this.logger.log(`Cleaned up ${result.deletedCount} old notification logs`);
  }
}
