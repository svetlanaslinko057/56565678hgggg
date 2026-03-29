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

/**
 * BLOCK 1: ArenaGateway - Real-Time Layer for FOMO Arena
 * 
 * Handles WebSocket connections and broadcasts events:
 * - BET_PLACED
 * - POSITION_WON / POSITION_LOST
 * - DUEL_INVITE / DUEL_ACCEPTED / DUEL_DECLINED / DUEL_RESULT
 * - XP_EARNED
 * - MARKET_RESOLVED
 * - BALANCE_UPDATE
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class ArenaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ArenaGateway.name);
  private readonly connectedUsers: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`[Arena] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[Arena] Client disconnected: ${client.id}`);
    // Clean up from all rooms
    this.connectedUsers.forEach((sockets, wallet) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(wallet);
      }
    });
  }

  /**
   * Client subscribes to their wallet's events
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

    this.logger.log(`[Arena] Client ${client.id} subscribed to wallet: ${wallet}`);
    return { success: true, wallet };
  }

  /**
   * Client unsubscribes from events
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

    this.logger.log(`[Arena] Client ${client.id} unsubscribed from wallet: ${wallet}`);
    return { success: true, wallet };
  }

  /**
   * Send notification to a specific user
   * Called from event listeners
   */
  notifyUser(userWallet: string, event: {
    type: string;
    data: any;
  }) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('notification', event);
    this.logger.log(`[Arena] Notification sent to ${wallet}: ${event.type}`);
  }

  /**
   * Broadcast activity to all connected clients
   * For live activity feed
   */
  broadcastActivity(event: {
    type: string;
    data: any;
  }) {
    this.server.emit('activity', event);
    this.logger.log(`[Arena] Activity broadcast: ${event.type}`);
  }

  /**
   * BLOCK 2: Send balance update to a specific user
   * Called when: bet placed, position won/lost, claim payout
   */
  sendBalanceUpdate(userWallet: string, balance: number, change: number, reason: string) {
    const wallet = userWallet.toLowerCase();
    this.server.to(`wallet:${wallet}`).emit('BALANCE_UPDATE', { 
      balance, 
      change, 
      reason,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`[Arena] Balance update sent to ${wallet}: ${balance} (${change > 0 ? '+' : ''}${change})`);
  }

  /**
   * Send bet placed event
   */
  sendBetPlaced(userWallet: string, data: {
    positionId: string;
    marketId: string;
    marketTitle: string;
    outcomeLabel: string;
    stake: number;
    odds: number;
    potentialReturn: number;
  }) {
    this.notifyUser(userWallet, {
      type: 'BET_PLACED',
      data,
    });
    
    // Also broadcast to activity feed
    this.broadcastActivity({
      type: 'BET_PLACED',
      data: {
        ...data,
        wallet: userWallet.slice(0, 8) + '...',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send position won event
   */
  sendPositionWon(userWallet: string, data: {
    positionId: string;
    marketId: string;
    marketTitle: string;
    payout: number;
    profit: number;
    xpEarned?: number;
  }) {
    this.notifyUser(userWallet, {
      type: 'POSITION_WON',
      data,
    });
  }

  /**
   * Send position lost event
   */
  sendPositionLost(userWallet: string, data: {
    positionId: string;
    marketId: string;
    marketTitle: string;
    stake: number;
  }) {
    this.notifyUser(userWallet, {
      type: 'POSITION_LOST',
      data,
    });
  }

  /**
   * Send duel invite event
   */
  sendDuelInvite(opponentWallet: string, data: {
    duelId: string;
    challengerWallet: string;
    marketId: string;
    marketTitle: string;
    stake: number;
    side: string;
  }) {
    this.notifyUser(opponentWallet, {
      type: 'DUEL_INVITE',
      data,
    });
  }

  /**
   * Send duel accepted event
   */
  sendDuelAccepted(creatorWallet: string, data: {
    duelId: string;
    opponentWallet: string;
    marketId: string;
    totalPot: number;
  }) {
    this.notifyUser(creatorWallet, {
      type: 'DUEL_ACCEPTED',
      data,
    });
  }

  /**
   * Send duel result event
   */
  sendDuelResult(userWallet: string, data: {
    duelId: string;
    won: boolean;
    winnings: number;
    opponentWallet: string;
  }) {
    this.notifyUser(userWallet, {
      type: 'DUEL_RESULT',
      data,
    });
  }

  /**
   * Send XP earned event
   */
  sendXpEarned(userWallet: string, data: {
    amount: number;
    reason: string;
    source: string;
  }) {
    this.notifyUser(userWallet, {
      type: 'XP_EARNED',
      data,
    });
  }

  /**
   * Send market resolved event (broadcast to all)
   */
  sendMarketResolved(data: {
    marketId: string;
    marketTitle: string;
    winningOutcome: string;
  }) {
    this.server.emit('MARKET_RESOLVED', data);
    this.logger.log(`[Arena] Market resolved broadcast: ${data.marketId}`);
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
