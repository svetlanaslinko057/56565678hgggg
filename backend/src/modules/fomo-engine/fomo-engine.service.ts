import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * FOMO Engine Types
 */
export type FomoEventType = 
  | 'EDGE_JUMP'
  | 'WHALE_AGREEMENT'
  | 'CLOSING_SOON'
  | 'SOCIAL_SPIKE'
  | 'AI_CONFIDENCE';

export interface FomoEvent {
  type: FomoEventType;
  marketId: string;
  marketTitle: string;
  data: {
    edge?: number;
    edgeDelta?: number;
    whaleAmount?: number;
    aiSide?: 'YES' | 'NO';
    aiConfidence?: number;
    closingIn?: number;
    betsLastMinutes?: number;
    momentum?: number;
  };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  message: string;
}

interface EdgeHistory {
  marketId: string;
  timestamp: Date;
  yesEdge: number;
  noEdge: number;
}

/**
 * FOMO Engine Service
 * 
 * Detects and emits FOMO events:
 * - EDGE_JUMP: Edge increased > 5% in short time
 * - WHALE_AGREEMENT: Whale bet matches AI signal
 * - CLOSING_SOON: Market closing in < 60 minutes
 * - SOCIAL_SPIKE: Sudden increase in betting activity
 * - AI_CONFIDENCE: AI confidence > 75%
 */
@Injectable()
export class FomoEngineService {
  private readonly logger = new Logger(FomoEngineService.name);
  
  // Edge history for delta tracking
  private edgeHistory: Map<string, EdgeHistory[]> = new Map();
  
  // Active FOMO events
  private activeEvents: Map<string, FomoEvent> = new Map();
  
  // Thresholds
  private readonly EDGE_JUMP_THRESHOLD = 5; // 5% edge jump
  private readonly WHALE_THRESHOLD = 500; // $500+ bet
  private readonly CLOSING_THRESHOLD = 60; // 60 minutes
  private readonly SPIKE_THRESHOLD = 10; // 10 bets in 5 min
  private readonly AI_CONFIDENCE_THRESHOLD = 0.75;

  constructor(
    private eventEmitter: EventEmitter2,
  ) {
    this.logger.log('FOMO Engine initialized');
  }

  /**
   * Track edge for a market
   */
  trackEdge(marketId: string, yesEdge: number, noEdge: number): void {
    const history = this.edgeHistory.get(marketId) || [];
    
    history.push({
      marketId,
      timestamp: new Date(),
      yesEdge,
      noEdge,
    });
    
    // Keep last 20 entries
    if (history.length > 20) {
      history.shift();
    }
    
    this.edgeHistory.set(marketId, history);
    
    // Check for edge jump
    this.checkEdgeJump(marketId, history);
  }

  /**
   * Check for edge jump
   */
  private checkEdgeJump(marketId: string, history: EdgeHistory[]): void {
    if (history.length < 2) return;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const yesDelta = latest.yesEdge - previous.yesEdge;
    const noDelta = latest.noEdge - previous.noEdge;
    
    const maxDelta = Math.max(Math.abs(yesDelta), Math.abs(noDelta));
    
    if (maxDelta >= this.EDGE_JUMP_THRESHOLD) {
      const side = Math.abs(yesDelta) > Math.abs(noDelta) ? 'YES' : 'NO';
      const edge = side === 'YES' ? latest.yesEdge : latest.noEdge;
      
      this.emitFomoEvent({
        type: 'EDGE_JUMP',
        marketId,
        marketTitle: '', // Will be filled by caller
        data: {
          edge,
          edgeDelta: maxDelta,
        },
        priority: maxDelta >= 10 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date(),
        message: `Edge jumped ${maxDelta > 0 ? '+' : ''}${maxDelta.toFixed(1)}% on ${side}`,
      });
    }
  }

  /**
   * Process whale bet
   */
  processWhaleBet(params: {
    marketId: string;
    marketTitle: string;
    amount: number;
    side: 'YES' | 'NO';
    aiSide?: 'YES' | 'NO';
    aiConfidence?: number;
  }): void {
    const { marketId, marketTitle, amount, side, aiSide, aiConfidence } = params;
    
    if (amount < this.WHALE_THRESHOLD) return;
    
    // Check whale + AI agreement
    if (aiSide && side === aiSide && aiConfidence && aiConfidence > 0.6) {
      this.emitFomoEvent({
        type: 'WHALE_AGREEMENT',
        marketId,
        marketTitle,
        data: {
          whaleAmount: amount,
          aiSide,
          aiConfidence,
        },
        priority: 'HIGH',
        timestamp: new Date(),
        message: `Whale $${amount} bet ${side} + AI agrees (${Math.round(aiConfidence * 100)}%)`,
      });
    }
  }

  /**
   * Check closing markets
   */
  checkClosingMarket(params: {
    marketId: string;
    marketTitle: string;
    closeTime: Date;
    recentBetsCount: number;
  }): void {
    const { marketId, marketTitle, closeTime, recentBetsCount } = params;
    
    const minutesLeft = (closeTime.getTime() - Date.now()) / 60000;
    
    if (minutesLeft > 0 && minutesLeft <= this.CLOSING_THRESHOLD) {
      this.emitFomoEvent({
        type: 'CLOSING_SOON',
        marketId,
        marketTitle,
        data: {
          closingIn: Math.round(minutesLeft),
          betsLastMinutes: recentBetsCount,
        },
        priority: minutesLeft <= 15 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date(),
        message: `Closing in ${Math.round(minutesLeft)}m | ${recentBetsCount} bets last 5 min`,
      });
    }
  }

  /**
   * Track betting activity spike
   */
  trackActivitySpike(params: {
    marketId: string;
    marketTitle: string;
    betsInWindow: number;
    windowMinutes: number;
  }): void {
    const { marketId, marketTitle, betsInWindow, windowMinutes } = params;
    
    if (betsInWindow >= this.SPIKE_THRESHOLD) {
      this.emitFomoEvent({
        type: 'SOCIAL_SPIKE',
        marketId,
        marketTitle,
        data: {
          betsLastMinutes: betsInWindow,
          momentum: betsInWindow / windowMinutes,
        },
        priority: betsInWindow >= 20 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date(),
        message: `${betsInWindow} people betting right now`,
      });
    }
  }

  /**
   * Track AI confidence
   */
  trackAIConfidence(params: {
    marketId: string;
    marketTitle: string;
    side: 'YES' | 'NO';
    confidence: number;
    edge: number;
  }): void {
    const { marketId, marketTitle, side, confidence, edge } = params;
    
    if (confidence >= this.AI_CONFIDENCE_THRESHOLD) {
      this.emitFomoEvent({
        type: 'AI_CONFIDENCE',
        marketId,
        marketTitle,
        data: {
          aiSide: side,
          aiConfidence: confidence,
          edge,
        },
        priority: confidence >= 0.85 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date(),
        message: `AI confidence ${Math.round(confidence * 100)}% on ${side}`,
      });
    }
  }

  /**
   * Emit FOMO event
   */
  private emitFomoEvent(event: FomoEvent): void {
    // Deduplicate - don't emit same event type for same market within 5 min
    const key = `${event.marketId}-${event.type}`;
    const existing = this.activeEvents.get(key);
    
    if (existing) {
      const timeDiff = Date.now() - existing.timestamp.getTime();
      if (timeDiff < 5 * 60 * 1000) {
        return; // Skip duplicate
      }
    }
    
    this.activeEvents.set(key, event);
    
    this.logger.log(`FOMO Event: ${event.type} - ${event.message}`);
    this.eventEmitter.emit('fomo.event', event);
  }

  /**
   * Get active FOMO events for a market
   */
  getActiveEvents(marketId?: string): FomoEvent[] {
    const events = Array.from(this.activeEvents.values());
    
    if (marketId) {
      return events.filter(e => e.marketId === marketId);
    }
    
    return events;
  }

  /**
   * Get best signal (highest priority event)
   */
  getBestSignal(): FomoEvent | null {
    const events = this.getActiveEvents();
    
    if (events.length === 0) return null;
    
    // Sort by priority and recency
    events.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    return events[0];
  }

  /**
   * Cleanup old events every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  cleanupOldEvents(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, event] of this.activeEvents) {
      if (now - event.timestamp.getTime() > maxAge) {
        this.activeEvents.delete(key);
      }
    }
  }
}
