import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationResponse } from './notifications.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from all wallet rooms
    this.connectedUsers.forEach((sockets, wallet) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(wallet);
      }
    });
  }

  /**
   * Client subscribes to notifications for their wallet
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { wallet: string },
  ) {
    const wallet = data.wallet?.toLowerCase();
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }

    // Join wallet-specific room
    client.join(`wallet:${wallet}`);

    // Track connection
    if (!this.connectedUsers.has(wallet)) {
      this.connectedUsers.set(wallet, new Set());
    }
    this.connectedUsers.get(wallet)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to wallet: ${wallet}`);
    return { success: true, wallet };
  }

  /**
   * Client unsubscribes from notifications
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { wallet: string },
  ) {
    const wallet = data.wallet?.toLowerCase();
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }

    client.leave(`wallet:${wallet}`);

    const sockets = this.connectedUsers.get(wallet);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(wallet);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from wallet: ${wallet}`);
    return { success: true, wallet };
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userWallet: string, notification: NotificationResponse) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('notification:new', notification);
    this.logger.log(`Notification sent to ${wallet}: ${notification.type}`);
  }

  /**
   * Send read status update
   */
  sendReadUpdate(userWallet: string, notificationIds: string[]) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('notification:read', { notificationIds });
  }

  /**
   * Send unread count update
   */
  sendUnreadCountUpdate(userWallet: string, count: number) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('notification:unread-count', { count });
  }

  /**
   * Broadcast to all connected clients (for system-wide announcements)
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Send live activity to all clients
   */
  broadcastActivity(data: any) {
    this.server.emit('activity', data);
  }

  /**
   * Send balance update to a specific user
   */
  sendBalanceUpdate(userWallet: string, balance: number, change: number, reason: string) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('balance:update', { balance, change, reason });
    this.logger.log(`Balance update sent to ${wallet}: ${balance} (${change > 0 ? '+' : ''}${change})`);
  }

  /**
   * Check if user is online
   */
  isUserOnline(wallet: string): boolean {
    const sockets = this.connectedUsers.get(wallet.toLowerCase());
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}
