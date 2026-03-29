import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationStatus, NotificationAction, NotificationPayload } from './notifications.schema';
import { CreateNotificationDto, NotificationResponse, NotificationsListResponse } from './notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification and push via WebSocket
   */
  async create(dto: CreateNotificationDto): Promise<NotificationResponse> {
    const notification = new this.notificationModel({
      userWallet: dto.userWallet,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      payload: dto.payload || {},
      actions: dto.actions || [],
      status: NotificationStatus.PENDING,
      read: false,
    });

    const saved = await notification.save();
    this.logger.log(`Notification created: ${saved._id} for ${dto.userWallet}`);

    const response = this.toResponse(saved);

    // Push via WebSocket
    try {
      this.gateway.sendNotification(dto.userWallet, response);
      saved.status = NotificationStatus.DELIVERED;
      await saved.save();
    } catch (error) {
      this.logger.warn(`Failed to push notification via WebSocket: ${error.message}`);
    }

    return response;
  }

  /**
   * Get notifications for a user with cursor-based pagination
   */
  async findAll(
    userWallet: string,
    limit: number = 20,
    cursor?: string,
    unreadOnly: boolean = false,
  ): Promise<NotificationsListResponse> {
    const query: any = { userWallet };

    if (unreadOnly) {
      query.read = false;
    }

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const notifications = await this.notificationModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = notifications.length > limit;
    const data = notifications.slice(0, limit).map(n => this.toResponseFromLean(n));
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userWallet: string, notificationIds: string[]): Promise<number> {
    // Filter valid ObjectIds
    const validIds = notificationIds.filter(id => {
      try {
        new Types.ObjectId(id);
        return true;
      } catch {
        return false;
      }
    });

    if (validIds.length === 0) {
      return 0;
    }

    const result = await this.notificationModel.updateMany(
      {
        _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
        userWallet,
      },
      {
        $set: { read: true, readAt: new Date() },
      },
    );

    if (result.modifiedCount > 0) {
      // Notify via WebSocket
      this.gateway.sendReadUpdate(userWallet, notificationIds);
    }

    return result.modifiedCount;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userWallet: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      { userWallet, read: false },
      { $set: { read: true, readAt: new Date() } },
    );

    if (result.modifiedCount > 0) {
      this.gateway.sendReadUpdate(userWallet, ['all']);
    }

    return result.modifiedCount;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userWallet: string): Promise<number> {
    return this.notificationModel.countDocuments({ userWallet, read: false });
  }

  /**
   * Delete a notification
   */
  async delete(userWallet: string, notificationId: string): Promise<boolean> {
    // Validate ObjectId
    try {
      new Types.ObjectId(notificationId);
    } catch {
      return false;
    }
    
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userWallet,
    });
    return result.deletedCount > 0;
  }

  // ============================================
  // NOTIFICATION CREATORS (called from other services)
  // ============================================

  /**
   * Create duel request notification
   */
  async notifyDuelRequest(
    opponentWallet: string,
    challengerWallet: string,
    duelId: string,
    marketId: string,
    stake: number,
    predictionTitle?: string,
  ): Promise<NotificationResponse> {
    const shortWallet = challengerWallet.slice(0, 8) + '...';
    
    return this.create({
      userWallet: opponentWallet,
      type: NotificationType.DUEL_REQUEST,
      title: 'New Duel Challenge',
      message: `${shortWallet} challenged you${predictionTitle ? ` on "${predictionTitle}"` : ''}`,
      payload: {
        duelId,
        marketId,
        stake,
        challengerWallet,
      },
      actions: [
        { type: 'accept_duel', label: 'Accept' },
        { type: 'decline_duel', label: 'Decline' },
        { type: 'view_duel', label: 'View Details' },
      ],
    });
  }

  /**
   * Create duel accepted notification
   */
  async notifyDuelAccepted(
    creatorWallet: string,
    opponentWallet: string,
    duelId: string,
    marketId: string,
    totalPot: number,
  ): Promise<NotificationResponse> {
    const shortWallet = opponentWallet.slice(0, 8) + '...';
    
    return this.create({
      userWallet: creatorWallet,
      type: NotificationType.DUEL_ACCEPTED,
      title: 'Duel Accepted',
      message: `${shortWallet} accepted your duel challenge. Total pot: ${totalPot} USDT`,
      payload: {
        duelId,
        marketId,
        opponentWallet,
        stake: totalPot,
      },
      actions: [
        { type: 'view_duel', label: 'View Duel' },
      ],
    });
  }

  /**
   * Create duel declined notification
   */
  async notifyDuelDeclined(
    creatorWallet: string,
    opponentWallet: string,
    duelId: string,
  ): Promise<NotificationResponse> {
    const shortWallet = opponentWallet.slice(0, 8) + '...';
    
    return this.create({
      userWallet: creatorWallet,
      type: NotificationType.DUEL_DECLINED,
      title: 'Duel Declined',
      message: `${shortWallet} declined your duel challenge`,
      payload: {
        duelId,
        opponentWallet,
      },
      actions: [
        { type: 'view_duels', label: 'View Your Duels' },
      ],
    });
  }

  /**
   * Create duel result notification
   */
  async notifyDuelResult(
    userWallet: string,
    duelId: string,
    won: boolean,
    winnings: number,
    opponentWallet: string,
  ): Promise<NotificationResponse> {
    const shortOpponent = opponentWallet.slice(0, 8) + '...';
    
    return this.create({
      userWallet,
      type: NotificationType.DUEL_RESULT,
      title: won ? '🎉 Duel Won!' : 'Duel Lost',
      message: won
        ? `You won ${winnings} USDT against ${shortOpponent}`
        : `You lost against ${shortOpponent}`,
      payload: {
        duelId,
        won,
        winnings: won ? winnings : 0,
        opponentWallet,
      },
      actions: [
        { type: 'view_duel', label: 'View Details' },
      ],
    });
  }

  /**
   * Create prediction won notification
   */
  async notifyPredictionWon(
    userWallet: string,
    predictionId: string,
    marketId: string,
    winnings: number,
    title: string,
  ): Promise<NotificationResponse> {
    return this.create({
      userWallet,
      type: NotificationType.PREDICTION_WON,
      title: '🎉 Prediction Won!',
      message: `Your prediction "${title}" was correct! You won ${winnings} USDT`,
      payload: {
        predictionId,
        marketId,
        winnings,
      },
      actions: [
        { type: 'view_prediction', label: 'View Details' },
        { type: 'claim_winnings', label: 'Claim' },
      ],
    });
  }

  /**
   * Create prediction lost notification
   */
  async notifyPredictionLost(
    userWallet: string,
    predictionId: string,
    marketId: string,
    title: string,
  ): Promise<NotificationResponse> {
    return this.create({
      userWallet,
      type: NotificationType.PREDICTION_LOST,
      title: 'Prediction Lost',
      message: `Your prediction "${title}" was incorrect`,
      payload: {
        predictionId,
        marketId,
      },
      actions: [
        { type: 'view_prediction', label: 'View Details' },
      ],
    });
  }

  /**
   * Create XP earned notification
   */
  async notifyXpEarned(
    userWallet: string,
    xpAmount: number,
    reason: string,
  ): Promise<NotificationResponse> {
    return this.create({
      userWallet,
      type: NotificationType.XP_EARNED,
      title: '⭐ XP Earned!',
      message: `You earned ${xpAmount} XP for ${reason}`,
      payload: {
        xpAmount,
        reason,
      },
      actions: [
        { type: 'view_profile', label: 'View Profile' },
      ],
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private toResponse(doc: NotificationDocument): NotificationResponse {
    return {
      id: doc._id.toString(),
      userWallet: doc.userWallet,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      payload: doc.payload,
      actions: doc.actions,
      read: doc.read,
      createdAt: (doc as any).createdAt,
    };
  }

  private toResponseFromLean(doc: any): NotificationResponse {
    return {
      id: doc._id.toString(),
      userWallet: doc.userWallet,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      payload: doc.payload || {},
      actions: doc.actions || [],
      read: doc.read,
      createdAt: doc.createdAt,
    };
  }
}
