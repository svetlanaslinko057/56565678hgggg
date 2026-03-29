import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './notifications.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notifications for current user
   * GET /api/notifications
   */
  @Get()
  async findAll(
    @Headers('x-wallet-address') walletAddress: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const result = await this.notificationsService.findAll(
      wallet,
      limit ? parseInt(limit, 10) : 20,
      cursor,
      unreadOnly === 'true',
    );
    return ApiResponse.success(result);
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Headers('x-wallet-address') walletAddress: string) {
    const wallet = walletAddress || '0xDefaultWallet';
    const count = await this.notificationsService.getUnreadCount(wallet);
    return ApiResponse.success({ count });
  }

  /**
   * Mark notifications as read (batch)
   * POST /api/notifications/mark-read
   */
  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  async markAsReadBatch(
    @Headers('x-wallet-address') walletAddress: string,
    @Body() dto: MarkReadDto,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const count = await this.notificationsService.markAsRead(wallet, dto.notificationIds);
    return ApiResponse.success({ markedCount: count }, `Marked ${count} notifications as read`);
  }

  /**
   * Mark single notification as read
   * POST /api/notifications/:id/read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markSingleAsRead(
    @Param('id') id: string,
    @Headers('x-wallet-address') walletAddress: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const count = await this.notificationsService.markAsRead(wallet, [id]);
    return ApiResponse.success({ markedCount: count, success: count > 0 });
  }

  /**
   * Mark all as read
   * POST /api/notifications/read-all
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsReadAlias(@Headers('x-wallet-address') walletAddress: string) {
    const wallet = walletAddress || '0xDefaultWallet';
    const count = await this.notificationsService.markAllAsRead(wallet);
    return ApiResponse.success({ markedCount: count }, `Marked ${count} notifications as read`);
  }

  /**
   * Mark all as read (legacy)
   * POST /api/notifications/mark-all-read
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Headers('x-wallet-address') walletAddress: string) {
    const wallet = walletAddress || '0xDefaultWallet';
    const count = await this.notificationsService.markAllAsRead(wallet);
    return ApiResponse.success({ markedCount: count }, `Marked ${count} notifications as read`);
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('x-wallet-address') walletAddress: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const deleted = await this.notificationsService.delete(wallet, id);
    if (deleted) {
      return ApiResponse.success({ deleted: true }, 'Notification deleted');
    }
    return ApiResponse.success({ deleted: false }, 'Notification not found');
  }
}
