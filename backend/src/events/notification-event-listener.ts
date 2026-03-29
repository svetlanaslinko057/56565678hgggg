import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { NotificationsGateway } from '../modules/notifications/notifications.gateway';
import { ArenaGateway } from '../modules/realtime/realtime.gateway';
import { NotificationType } from '../modules/notifications/notifications.schema';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTS,
  BetPlacedEvent,
  PositionResolvedEvent,
  DuelInviteEvent,
  DuelAcceptedEvent,
  DuelResolvedEvent,
  XpEarnedEvent,
  ReferralBonusEvent,
  BalanceChangedEvent,
  MarketResolvedEvent,
} from './event-types';

/**
 * Notification Event Listener
 * Listens to platform events and creates notifications + pushes via WebSocket
 */
@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,
    private readonly arenaGateway: ArenaGateway,
  ) {}

  /**
   * Handle bet placed event
   */
  @OnEvent(EVENTS.BET_PLACED)
  async handleBetPlaced(event: BetPlacedEvent) {
    this.logger.log(`Bet placed: ${event.wallet} on ${event.marketTitle}`);
    
    const notification = await this.notificationsService.create({
      userWallet: event.wallet,
      type: NotificationType.XP_EARNED,
      title: 'Prediction Placed',
      message: `Your ${event.outcomeLabel} prediction on "${event.marketTitle}" is now active`,
      payload: {
        positionId: event.positionId,
        marketId: event.marketId,
        stake: event.stake,
        odds: event.odds,
        outcomeLabel: event.outcomeLabel,
      },
      actions: [
        { type: 'view_position', label: 'View Position' },
      ],
    });
    
    this.pushToUser(event.wallet, notification);
    
    // Push to Arena Gateway for real-time activity feed
    this.arenaGateway.sendBetPlaced(event.wallet, {
      positionId: event.positionId,
      marketId: event.marketId,
      marketTitle: event.marketTitle,
      outcomeLabel: event.outcomeLabel,
      stake: event.stake,
      odds: event.odds,
      potentialReturn: event.stake * event.odds,
    });
  }

  /**
   * Handle position won event
   */
  @OnEvent(EVENTS.POSITION_WON)
  async handlePositionWon(event: PositionResolvedEvent) {
    this.logger.log(`Position won: ${event.wallet} - ${event.payout} USDT`);
    
    await this.notificationsService.notifyPredictionWon(
      event.wallet,
      event.positionId,
      event.marketId,
      event.payout,
      event.marketTitle,
    );

    // Push to Arena Gateway
    this.arenaGateway.sendPositionWon(event.wallet, {
      positionId: event.positionId,
      marketId: event.marketId,
      marketTitle: event.marketTitle,
      payout: event.payout,
      profit: event.payout - event.stake,
      xpEarned: event.xpEarned,
    });

    // Also send XP notification
    if (event.xpEarned > 0) {
      await this.notificationsService.notifyXpEarned(
        event.wallet,
        event.xpEarned,
        'winning prediction',
      );
      
      this.arenaGateway.sendXpEarned(event.wallet, {
        amount: event.xpEarned,
        reason: 'winning prediction',
        source: 'position_win',
      });
    }
  }

  /**
   * Handle position lost event
   */
  @OnEvent(EVENTS.POSITION_LOST)
  async handlePositionLost(event: PositionResolvedEvent) {
    this.logger.log(`Position lost: ${event.wallet}`);
    
    await this.notificationsService.notifyPredictionLost(
      event.wallet,
      event.positionId,
      event.marketId,
      event.marketTitle,
    );

    // Push to Arena Gateway
    this.arenaGateway.sendPositionLost(event.wallet, {
      positionId: event.positionId,
      marketId: event.marketId,
      marketTitle: event.marketTitle,
      stake: event.stake,
    });

    // Small XP for participation
    if (event.xpEarned > 0) {
      await this.notificationsService.notifyXpEarned(
        event.wallet,
        event.xpEarned,
        'market participation',
      );
      
      this.arenaGateway.sendXpEarned(event.wallet, {
        amount: event.xpEarned,
        reason: 'market participation',
        source: 'position_loss',
      });
    }
  }

  /**
   * Handle duel invite event
   */
  @OnEvent(EVENTS.DUEL_INVITE)
  async handleDuelInvite(event: DuelInviteEvent) {
    this.logger.log(`Duel invite: ${event.challengerWallet} -> ${event.opponentWallet}`);
    
    await this.notificationsService.notifyDuelRequest(
      event.opponentWallet,
      event.challengerWallet,
      event.duelId,
      event.marketId,
      event.stake,
      event.marketTitle,
    );
    
    // Push to Arena Gateway
    this.arenaGateway.sendDuelInvite(event.opponentWallet, {
      duelId: event.duelId,
      challengerWallet: event.challengerWallet,
      marketId: event.marketId,
      marketTitle: event.marketTitle,
      stake: event.stake,
      side: event.challengerSide,
    });
  }

  /**
   * Handle duel accepted event
   */
  @OnEvent(EVENTS.DUEL_ACCEPTED)
  async handleDuelAccepted(event: DuelAcceptedEvent) {
    this.logger.log(`Duel accepted: ${event.duelId}`);
    
    await this.notificationsService.notifyDuelAccepted(
      event.creatorWallet,
      event.opponentWallet,
      event.duelId,
      event.marketId,
      event.totalPot,
    );
    
    // Push to Arena Gateway
    this.arenaGateway.sendDuelAccepted(event.creatorWallet, {
      duelId: event.duelId,
      opponentWallet: event.opponentWallet,
      marketId: event.marketId,
      totalPot: event.totalPot,
    });
  }

  /**
   * Handle duel resolved event
   */
  @OnEvent(EVENTS.DUEL_RESOLVED)
  async handleDuelResolved(event: DuelResolvedEvent) {
    this.logger.log(`Duel resolved: winner=${event.winnerWallet}`);
    
    // Notify winner
    await this.notificationsService.notifyDuelResult(
      event.winnerWallet,
      event.duelId,
      true,
      event.winnings,
      event.loserWallet,
    );

    // Notify loser
    await this.notificationsService.notifyDuelResult(
      event.loserWallet,
      event.duelId,
      false,
      0,
      event.winnerWallet,
    );
    
    // Push to Arena Gateway - winner
    this.arenaGateway.sendDuelResult(event.winnerWallet, {
      duelId: event.duelId,
      won: true,
      winnings: event.winnings,
      opponentWallet: event.loserWallet,
    });
    
    // Push to Arena Gateway - loser
    this.arenaGateway.sendDuelResult(event.loserWallet, {
      duelId: event.duelId,
      won: false,
      winnings: 0,
      opponentWallet: event.winnerWallet,
    });
  }

  /**
   * Handle XP earned event
   */
  @OnEvent(EVENTS.XP_EARNED)
  async handleXpEarned(event: XpEarnedEvent) {
    this.logger.log(`XP earned: ${event.wallet} +${event.amount}`);
    
    await this.notificationsService.notifyXpEarned(
      event.wallet,
      event.amount,
      event.reason,
    );
    
    // Push to Arena Gateway
    this.arenaGateway.sendXpEarned(event.wallet, {
      amount: event.amount,
      reason: event.reason,
      source: event.source,
    });
  }

  /**
   * Handle referral bonus event
   */
  @OnEvent(EVENTS.REFERRAL_BONUS)
  async handleReferralBonus(event: ReferralBonusEvent) {
    this.logger.log(`Referral bonus: ${event.referrerWallet} +${event.xpAwarded} XP`);
    
    const shortNewUser = event.newUserWallet.slice(0, 8) + '...';
    
    const notification = await this.notificationsService.create({
      userWallet: event.referrerWallet,
      type: NotificationType.XP_EARNED,
      title: 'Referral Bonus!',
      message: `${shortNewUser} joined via your link! You earned +${event.xpAwarded} XP and +${event.lpAwarded} LP`,
      payload: {
        xpAmount: event.xpAwarded,
        lpAmount: event.lpAwarded,
        newUserWallet: event.newUserWallet,
      },
      actions: [
        { type: 'view_referrals', label: 'View Referrals' },
      ],
    });
    
    this.pushToUser(event.referrerWallet, notification);
  }

  /**
   * Handle balance changed event → push to WebSocket
   */
  @OnEvent(EVENTS.BALANCE_CHANGED)
  async handleBalanceChanged(event: BalanceChangedEvent) {
    this.logger.log(`Balance changed: ${event.wallet} → ${event.balance} (${event.change > 0 ? '+' : ''}${event.change})`);
    
    // Push to NotificationsGateway (legacy)
    this.gateway.sendBalanceUpdate(event.wallet, event.balance, event.change, event.reason);
    
    // Push to ArenaGateway (new real-time layer)
    this.arenaGateway.sendBalanceUpdate(event.wallet, event.balance, event.change, event.reason);
  }

  /**
   * Handle market resolved event
   */
  @OnEvent(EVENTS.MARKET_RESOLVED)
  async handleMarketResolved(event: MarketResolvedEvent) {
    this.logger.log(`Market resolved: ${event.marketId} - winner: ${event.winningOutcome}`);
    
    // Broadcast to all connected clients
    this.arenaGateway.sendMarketResolved({
      marketId: event.marketId,
      marketTitle: event.marketTitle,
      winningOutcome: event.winningOutcome,
    });
  }

  /**
   * Push notification to user via WebSocket
   */
  private pushToUser(wallet: string, notification: any) {
    try {
      const payload = {
        id: notification._id?.toString() || notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        payload: notification.payload,
        read: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      };
      this.gateway.sendNotification(wallet, payload as any);
    } catch (err) {
      this.logger.warn(`WS push failed for ${wallet}: ${err.message}`);
    }
  }
}
