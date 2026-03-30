import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';

@ApiTags('Push Notifications')
@Controller('push')
export class PushNotificationsController {
  constructor(private readonly pushService: PushNotificationsService) {}

  @Get('subscriptions/:wallet')
  @ApiOperation({ summary: 'Get user subscriptions' })
  async getSubscriptions(@Param('wallet') wallet: string) {
    const sub = await this.pushService.getSubscriptions(wallet);
    return {
      success: true,
      data: {
        wallet: sub.wallet,
        telegramId: sub.telegramId ? '***linked***' : null,
        watchlistMarkets: sub.watchlistMarkets,
        watchlistRivals: sub.watchlistRivals,
        settings: sub.settings,
        notificationsSentToday: sub.notificationsSentToday,
        isActive: sub.isActive,
      },
    };
  }

  @Post('subscriptions/:wallet/watch-market')
  @ApiOperation({ summary: 'Add market to watchlist' })
  async watchMarket(
    @Param('wallet') wallet: string,
    @Body() body: { marketId: string }
  ) {
    await this.pushService.watchMarket(wallet, body.marketId);
    return { success: true, message: 'Market added to watchlist' };
  }

  @Delete('subscriptions/:wallet/watch-market/:marketId')
  @ApiOperation({ summary: 'Remove market from watchlist' })
  async unwatchMarket(
    @Param('wallet') wallet: string,
    @Param('marketId') marketId: string
  ) {
    await this.pushService.unwatchMarket(wallet, marketId);
    return { success: true, message: 'Market removed from watchlist' };
  }

  @Post('subscriptions/:wallet/watch-rival')
  @ApiOperation({ summary: 'Add rival to watchlist' })
  async watchRival(
    @Param('wallet') wallet: string,
    @Body() body: { rivalWallet: string }
  ) {
    await this.pushService.watchRival(wallet, body.rivalWallet);
    return { success: true, message: 'Rival added to watchlist' };
  }

  @Put('subscriptions/:wallet/settings')
  @ApiOperation({ summary: 'Update notification settings' })
  async updateSettings(
    @Param('wallet') wallet: string,
    @Body() settings: {
      edgeAlerts?: boolean;
      whaleAlerts?: boolean;
      closingAlerts?: boolean;
      winAlerts?: boolean;
      rivalAlerts?: boolean;
      maxDailyNotifications?: number;
      edgeThreshold?: number;
      whaleThreshold?: number;
    }
  ) {
    await this.pushService.updateSettings(wallet, settings);
    return { success: true, message: 'Settings updated' };
  }

  @Post('subscriptions/:wallet/link-telegram')
  @ApiOperation({ summary: 'Link Telegram ID to wallet' })
  async linkTelegram(
    @Param('wallet') wallet: string,
    @Body() body: { telegramId: string }
  ) {
    await this.pushService.linkTelegram(wallet, body.telegramId);
    return { success: true, message: 'Telegram linked' };
  }

  @Get('stats/:wallet')
  @ApiOperation({ summary: 'Get notification stats' })
  async getStats(@Param('wallet') wallet: string) {
    const stats = await this.pushService.getStats(wallet);
    return { success: true, data: stats };
  }

  @Post('track-click/:notificationId')
  @ApiOperation({ summary: 'Track notification click' })
  async trackClick(@Param('notificationId') notificationId: string) {
    await this.pushService.trackClick(notificationId);
    return { success: true };
  }

  // Test endpoint for development
  @Post('test/:wallet')
  @ApiOperation({ summary: 'Send test notification (dev only)' })
  async testPush(
    @Param('wallet') wallet: string,
    @Body() body: { type: string; message: string }
  ) {
    const result = await this.pushService.sendPush({
      wallet,
      type: body.type as any,
      title: '🧪 Test Notification',
      message: body.message || 'This is a test notification',
    });
    return { success: result, message: result ? 'Sent' : 'Failed (check logs)' };
  }
}
