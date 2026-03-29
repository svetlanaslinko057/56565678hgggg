/**
 * Platform Event Types
 * All events that can trigger notifications
 */

// Position/Bet Events
export const EVENTS = {
  // Bet placed
  BET_PLACED: 'bet.placed',
  
  // Position resolved
  POSITION_WON: 'position.won',
  POSITION_LOST: 'position.lost',
  POSITION_CLAIMABLE: 'position.claimable',
  POSITION_CLAIMED: 'position.claimed',
  
  // Market events
  MARKET_CREATED: 'market.created',
  MARKET_LOCKED: 'market.locked',
  MARKET_RESOLVED: 'market.resolved',
  
  // Duel events
  DUEL_CREATED: 'duel.created',
  DUEL_INVITE: 'duel.invite',
  DUEL_ACCEPTED: 'duel.accepted',
  DUEL_DECLINED: 'duel.declined',
  DUEL_RESOLVED: 'duel.resolved',
  
  // Season events
  SEASON_RANK_UP: 'season.rank_up',
  SEASON_REWARD: 'season.reward',
  
  // Social events
  REFERRAL_BONUS: 'referral.bonus',
  XP_EARNED: 'xp.earned',
  BADGE_EARNED: 'badge.earned',
  
  // Balance events
  BALANCE_CHANGED: 'balance.changed',
  
  // Share events
  SHARE_CLICKED: 'share.clicked',
  SHARE_CONVERSION: 'share.conversion',
  
  // Market draft events
  MARKET_SUBMITTED: 'market.submitted',
  MARKET_APPROVED: 'market.approved',
  MARKET_REJECTED: 'market.rejected',
  
  // Voting events
  VOTE_STARTED: 'vote.started',
  VOTE_ENDED: 'vote.ended',
  
  // Duel result events
  DUEL_RESULT: 'duel.result',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

// Event payload interfaces
export interface BetPlacedEvent {
  wallet: string;
  positionId: string;
  marketId: string;
  marketTitle: string;
  outcomeLabel: string;
  stake: number;
  odds: number;
}

export interface PositionResolvedEvent {
  wallet: string;
  positionId: string;
  marketId: string;
  marketTitle: string;
  outcomeLabel: string;
  stake: number;
  odds: number;
  won: boolean;
  payout: number;
  xpEarned: number;
}

export interface DuelInviteEvent {
  opponentWallet: string;
  challengerWallet: string;
  challengerUsername?: string;
  duelId: string;
  marketId: string;
  marketTitle: string;
  stake: number;
  challengerSide: string;
  expiresAt?: Date;
}

export interface DuelAcceptedEvent {
  creatorWallet: string;
  opponentWallet: string;
  opponentUsername?: string;
  duelId: string;
  marketId: string;
  totalPot: number;
}

export interface DuelResolvedEvent {
  winnerWallet: string;
  loserWallet: string;
  duelId: string;
  winnings: number;
}

export interface XpEarnedEvent {
  wallet: string;
  amount: number;
  reason: string;
  source: string;
}

export interface ReferralBonusEvent {
  referrerWallet: string;
  newUserWallet: string;
  xpAwarded: number;
  lpAwarded: number;
}

export interface MarketResolvedEvent {
  marketId: string;
  marketTitle: string;
  winningOutcome: string;
  resolvedAt: Date;
}

export interface BalanceChangedEvent {
  wallet: string;
  balance: number;
  change: number;
  reason: string;
}
