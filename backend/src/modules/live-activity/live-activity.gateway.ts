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
import { OnEvent } from '@nestjs/event-emitter';
import { FomoEvent } from '../fomo-engine/fomo-engine.service';

/**
 * Live Activity Types
 */
export interface LiveActivity {
  type: 'BET' | 'WHALE' | 'WIN' | 'DUEL_START' | 'DUEL_END' | 'EDGE_JUMP' | 'MARKET_CLOSE';
  timestamp: Date;
  marketId?: string;
  marketTitle?: string;
  data: {
    wallet?: string;
    walletShort?: string;
    amount?: number;
    side?: 'YES' | 'NO';
    odds?: number;
    edge?: number;
    winnings?: number;
    isWhale?: boolean;
    streak?: number;
    rivalName?: string;
  };
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Live Activity Gateway
 * 
 * Real-time feed of arena activity:
 * - Whale bets
 * - Recent bets
 * - Edge jumps
 * - Wins
 * - Duel results
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  namespace: 'live',
})
export class LiveActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveActivityGateway.name);
  private readonly connectedClients: Set<string> = new Set();
  
  // Activity buffer for new connections
  private readonly activityBuffer: LiveActivity[] = [];
  private readonly MAX_BUFFER_SIZE = 50;
  
  // Stats
  private readonly WHALE_THRESHOLD = 100; // $100+ is whale
  private betsLastMinute = 0;
  private lastMinuteReset = Date.now();

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    this.logger.log(`[Live] Client connected: ${client.id} (total: ${this.connectedClients.size})`);
    
    // Send recent activity buffer to new client
    if (this.activityBuffer.length > 0) {
      client.emit('activity:history', this.activityBuffer.slice(-20));
    }
    
    // Send current stats
    client.emit('stats:live', {
      connectedUsers: this.connectedClients.size,
      betsLastMinute: this.betsLastMinute,
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`[Live] Client disconnected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  /**
   * Subscribe to specific market activity
   */
  @SubscribeMessage('subscribe:market')
  handleSubscribeMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string }
  ) {
    if (!data.marketId) {
      return { success: false, error: 'marketId required' };
    }
    
    client.join(`market:${data.marketId}`);
    this.logger.log(`[Live] ${client.id} subscribed to market ${data.marketId}`);
    return { success: true, marketId: data.marketId };
  }

  /**
   * Unsubscribe from market
   */
  @SubscribeMessage('unsubscribe:market')
  handleUnsubscribeMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string }
  ) {
    if (!data.marketId) {
      return { success: false, error: 'marketId required' };
    }
    
    client.leave(`market:${data.marketId}`);
    return { success: true };
  }

  // ==================== BROADCAST METHODS ====================

  /**
   * Broadcast new bet activity
   */
  broadcastBet(data: {
    wallet: string;
    marketId: string;
    marketTitle: string;
    amount: number;
    side: 'YES' | 'NO';
    odds: number;
  }): void {
    const isWhale = data.amount >= this.WHALE_THRESHOLD;
    const walletShort = `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}`;
    
    const activity: LiveActivity = {
      type: isWhale ? 'WHALE' : 'BET',
      timestamp: new Date(),
      marketId: data.marketId,
      marketTitle: data.marketTitle,
      data: {
        wallet: data.wallet,
        walletShort,
        amount: data.amount,
        side: data.side,
        odds: data.odds,
        isWhale,
      },
      message: isWhale 
        ? `🐋 ${walletShort} bet $${data.amount} ${data.side}`
        : `${walletShort} bet $${data.amount} ${data.side}`,
      priority: isWhale ? 'HIGH' : 'LOW',
    };

    this.addToBuffer(activity);
    this.incrementBetCounter();

    // Broadcast to all
    this.server.emit('activity:new', activity);
    
    // Broadcast to market room
    this.server.to(`market:${data.marketId}`).emit('market:bet', activity);

    this.logger.log(`[Live] Bet broadcast: ${activity.message}`);
  }

  /**
   * Broadcast win
   */
  broadcastWin(data: {
    wallet: string;
    marketId: string;
    marketTitle: string;
    winnings: number;
    streak?: number;
  }): void {
    const walletShort = `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}`;
    
    const activity: LiveActivity = {
      type: 'WIN',
      timestamp: new Date(),
      marketId: data.marketId,
      marketTitle: data.marketTitle,
      data: {
        wallet: data.wallet,
        walletShort,
        winnings: data.winnings,
        streak: data.streak,
      },
      message: data.streak && data.streak >= 3
        ? `🎉 ${walletShort} won $${data.winnings.toFixed(2)} (${data.streak} streak!)`
        : `🎉 ${walletShort} won $${data.winnings.toFixed(2)}`,
      priority: data.winnings >= 100 ? 'HIGH' : 'MEDIUM',
    };

    this.addToBuffer(activity);
    this.server.emit('activity:new', activity);
  }

  /**
   * Broadcast edge jump
   */
  broadcastEdgeJump(data: {
    marketId: string;
    marketTitle: string;
    edge: number;
    side: 'YES' | 'NO';
  }): void {
    const activity: LiveActivity = {
      type: 'EDGE_JUMP',
      timestamp: new Date(),
      marketId: data.marketId,
      marketTitle: data.marketTitle,
      data: {
        edge: data.edge,
        side: data.side,
      },
      message: `⚡ Edge jumped +${data.edge.toFixed(1)}% on ${data.side}`,
      priority: data.edge >= 15 ? 'HIGH' : 'MEDIUM',
    };

    this.addToBuffer(activity);
    this.server.emit('activity:new', activity);
    this.server.to(`market:${data.marketId}`).emit('market:edge', activity);
  }

  /**
   * Broadcast duel start
   */
  broadcastDuelStart(data: {
    duelId: string;
    creator: string;
    opponent: string;
    stake: number;
    marketTitle: string;
  }): void {
    const activity: LiveActivity = {
      type: 'DUEL_START',
      timestamp: new Date(),
      marketTitle: data.marketTitle,
      data: {
        amount: data.stake * 2,
      },
      message: `⚔️ New duel! $${data.stake * 2} pot`,
      priority: 'MEDIUM',
    };

    this.addToBuffer(activity);
    this.server.emit('activity:new', activity);
  }

  /**
   * Broadcast duel result
   */
  broadcastDuelResult(data: {
    winner: string;
    loser: string;
    winnings: number;
    rivalStreak?: number;
  }): void {
    const winnerShort = `${data.winner.slice(0, 6)}...`;
    
    const activity: LiveActivity = {
      type: 'DUEL_END',
      timestamp: new Date(),
      data: {
        wallet: data.winner,
        walletShort: winnerShort,
        winnings: data.winnings,
        streak: data.rivalStreak,
      },
      message: data.rivalStreak && data.rivalStreak >= 3
        ? `🏆 ${winnerShort} wins duel! $${data.winnings} (${data.rivalStreak} streak vs rival)`
        : `🏆 ${winnerShort} wins duel! $${data.winnings}`,
      priority: 'MEDIUM',
    };

    this.addToBuffer(activity);
    this.server.emit('activity:new', activity);
  }

  /**
   * Broadcast market close
   */
  broadcastMarketClose(data: {
    marketId: string;
    marketTitle: string;
    winningOutcome: string;
    totalVolume: number;
  }): void {
    const activity: LiveActivity = {
      type: 'MARKET_CLOSE',
      timestamp: new Date(),
      marketId: data.marketId,
      marketTitle: data.marketTitle,
      data: {
        amount: data.totalVolume,
        side: data.winningOutcome as any,
      },
      message: `📊 Market resolved: ${data.winningOutcome} wins! ($${data.totalVolume.toFixed(0)} volume)`,
      priority: 'HIGH',
    };

    this.addToBuffer(activity);
    this.server.emit('activity:new', activity);
    this.server.to(`market:${data.marketId}`).emit('market:resolved', activity);
  }

  // ==================== FOMO EVENT HANDLER ====================

  /**
   * Handle FOMO events and broadcast
   */
  @OnEvent('fomo.event')
  handleFomoEvent(event: FomoEvent): void {
    // Convert to live activity format
    let activity: LiveActivity;

    switch (event.type) {
      case 'EDGE_JUMP':
        this.broadcastEdgeJump({
          marketId: event.marketId,
          marketTitle: event.marketTitle,
          edge: event.data.edge || 0,
          side: event.data.aiSide || 'YES',
        });
        break;

      case 'WHALE_AGREEMENT':
        // Already handled in broadcastBet
        break;

      case 'CLOSING_SOON':
        activity = {
          type: 'MARKET_CLOSE',
          timestamp: new Date(),
          marketId: event.marketId,
          marketTitle: event.marketTitle,
          data: {},
          message: `⏰ ${event.marketTitle} closing in ${event.data.closingIn}m!`,
          priority: event.data.closingIn && event.data.closingIn <= 15 ? 'HIGH' : 'MEDIUM',
        };
        this.addToBuffer(activity);
        this.server.emit('activity:new', activity);
        break;

      case 'SOCIAL_SPIKE':
        activity = {
          type: 'BET',
          timestamp: new Date(),
          marketId: event.marketId,
          marketTitle: event.marketTitle,
          data: {},
          message: `🔥 ${event.data.betsLastMinutes} bets in last 5 min on ${event.marketTitle?.substring(0, 30)}...`,
          priority: 'MEDIUM',
        };
        this.addToBuffer(activity);
        this.server.emit('activity:new', activity);
        break;
    }
  }

  // ==================== HELPERS ====================

  private addToBuffer(activity: LiveActivity): void {
    this.activityBuffer.push(activity);
    if (this.activityBuffer.length > this.MAX_BUFFER_SIZE) {
      this.activityBuffer.shift();
    }
  }

  private incrementBetCounter(): void {
    // Reset counter every minute
    if (Date.now() - this.lastMinuteReset > 60000) {
      this.betsLastMinute = 0;
      this.lastMinuteReset = Date.now();
    }
    this.betsLastMinute++;

    // Broadcast updated stats periodically
    if (this.betsLastMinute % 5 === 0) {
      this.server.emit('stats:live', {
        connectedUsers: this.connectedClients.size,
        betsLastMinute: this.betsLastMinute,
      });
    }
  }

  /**
   * Get current activity stats
   */
  getStats() {
    return {
      connectedUsers: this.connectedClients.size,
      betsLastMinute: this.betsLastMinute,
      recentActivity: this.activityBuffer.slice(-10),
    };
  }
}
