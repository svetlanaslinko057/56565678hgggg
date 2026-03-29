/**
 * Arena API Client
 * Handles all API calls to the Arena backend
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Storage keys
const WALLET_KEY = 'arenaWallet';
const TOKEN_KEY = 'arenaToken';

// Get headers with auth
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add JWT token if exists
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add wallet address
  const wallet = typeof window !== 'undefined' ? localStorage.getItem(WALLET_KEY) : null;
  if (wallet) {
    headers['x-wallet-address'] = wallet;
  }
  
  return headers;
}

// Generic API call
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; meta?: any }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ==================== Wallet API ====================

export const WalletAPI = {
  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{
    wallet: string;
    balanceUsdt: number;
    isDemo: boolean;
  } | null> {
    const result = await apiCall<{
      wallet: string;
      balanceUsdt: number;
      isDemo: boolean;
    }>('/api/wallet/balance');
    
    return result.data || null;
  },

  /**
   * Get transaction history
   */
  async getHistory(page = 1, limit = 20): Promise<{ data: any[]; total: number }> {
    const result = await apiCall<any[]>(`/api/wallet/history?page=${page}&limit=${limit}`);
    return {
      data: result.data || [],
      total: result.meta?.total || 0,
    };
  },
};

// ==================== Markets API ====================

export const MarketsAPI = {
  /**
   * Get markets list
   */
  async getMarkets(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    riskLevel?: string;
  } = {}): Promise<{ data: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.type) query.set('type', params.type);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.riskLevel) query.set('riskLevel', params.riskLevel);
    
    const result = await apiCall<any[]>(`/api/predictions?${query}`);
    return {
      data: result.data || [],
      total: result.meta?.total || 0,
    };
  },

  /**
   * Get single market
   */
  async getMarket(id: string): Promise<any | null> {
    const result = await apiCall<any>(`/api/predictions/${id}`);
    return result.data || null;
  },

  /**
   * BLOCK 4: Get full market details
   * GET /api/markets/:id
   */
  async getMarketDetails(id: string): Promise<{
    id: string;
    title: string;
    description: string;
    outcomes: Array<{ id: string; label: string; probability: number; odds: number }>;
    volume: number;
    liquidity: number;
    closeTime: string;
    status: string;
    category: string;
    riskLevel: string;
    totalBets: number;
    participantsCount: number;
  } | null> {
    const result = await apiCall<any>(`/api/markets/${id}`);
    return result.data || null;
  },

  /**
   * BLOCK 3: Get odds history for charting
   * GET /api/markets/:id/odds-history
   */
  async getOddsHistory(id: string, params: {
    outcomeId?: string;
    period?: '1H' | '24H' | '7D' | '30D' | 'ALL';
    limit?: number;
  } = {}): Promise<Array<{
    marketId: string;
    outcomeId: string;
    outcomeLabel: string;
    price: number;
    odds: number;
    timestamp: string;
    totalStake: number;
  }>> {
    const query = new URLSearchParams();
    if (params.outcomeId) query.set('outcomeId', params.outcomeId);
    if (params.period) query.set('period', params.period);
    if (params.limit) query.set('limit', String(params.limit));
    
    const result = await apiCall<any[]>(`/api/markets/${id}/odds-history?${query}`);
    return result.data || [];
  },

  /**
   * Bet preview - calculate potential returns
   */
  async betPreview(
    marketId: string,
    stake: number,
    outcomeId: string
  ): Promise<{
    stake: number;
    odds: number;
    fee: number;
    potentialReturn: number;
    netReturn: number;
  } | null> {
    const result = await apiCall<any>(`/api/markets/${marketId}/bet-preview`, {
      method: 'POST',
      body: JSON.stringify({ stake, outcomeId }),
    });
    return result.data || null;
  },

  /**
   * Place bet
   */
  async placeBet(
    marketId: string,
    stake: number,
    outcomeId: string
  ): Promise<{ success: boolean; position?: any; error?: string }> {
    const result = await apiCall<any>(`/api/markets/${marketId}/bet`, {
      method: 'POST',
      body: JSON.stringify({ stake, outcomeId }),
    });
    
    return {
      success: result.success,
      position: result.data,
      error: result.error,
    };
  },

  /**
   * Get AI sentiment for market
   */
  async getAISentiment(marketId: string): Promise<any | null> {
    const result = await apiCall<any>(`/api/markets/${marketId}/ai`);
    return result.data || null;
  },

  /**
   * Get market stats
   */
  async getMarketStats(marketId: string): Promise<any | null> {
    const result = await apiCall<any>(`/api/markets/${marketId}/stats`);
    return result.data || null;
  },

  /**
   * Get live bets for a market
   */
  async getLiveBets(marketId: string, limit = 20): Promise<any[]> {
    const result = await apiCall<any[]>(`/api/markets/${marketId}/live-bets?limit=${limit}`);
    return result.data || [];
  },
};

// ==================== Positions API ====================

export const PositionsAPI = {
  /**
   * Get user's positions
   */
  async getMyPositions(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ data: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    
    const result = await apiCall<any[]>(`/api/positions/my?${query}`);
    return {
      data: result.data || [],
      total: result.meta?.total || 0,
    };
  },

  /**
   * Get single position
   */
  async getPosition(id: string): Promise<any | null> {
    const result = await apiCall<any>(`/api/positions/${id}`);
    return result.data || null;
  },

  /**
   * List position for sale
   */
  async listPosition(
    positionId: string,
    price: number
  ): Promise<{ success: boolean; listing?: any; error?: string }> {
    const result = await apiCall<any>(`/api/positions/${positionId}/list`, {
      method: 'POST',
      body: JSON.stringify({ price }),
    });
    
    return {
      success: result.success,
      listing: result.data,
      error: result.error,
    };
  },

  /**
   * Claim payout for won position
   */
  async claimPayout(positionId: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/positions/${positionId}/claim`, {
      method: 'POST',
    });
    
    return { success: result.success, error: result.error };
  },
};

// ==================== Marketplace API ====================

export const MarketplaceAPI = {
  /**
   * Get active listings
   */
  async getListings(params: {
    page?: number;
    limit?: number;
    marketId?: string;
  } = {}): Promise<{ data: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.marketId) query.set('marketId', params.marketId);
    
    const result = await apiCall<any[]>(`/api/marketplace/listings?${query}`);
    return {
      data: result.data || [],
      total: result.meta?.total || 0,
    };
  },

  /**
   * Buy listing
   */
  async buyListing(listingId: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/marketplace/listings/${listingId}/buy`, {
      method: 'POST',
    });
    
    return { success: result.success, error: result.error };
  },

  /**
   * Cancel listing
   */
  async cancelListing(listingId: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/marketplace/listings/${listingId}/cancel`, {
      method: 'POST',
    });
    
    return { success: result.success, error: result.error };
  },
};

// ==================== Activity API ====================

export const ActivityAPI = {
  /**
   * Get live activity feed
   */
  async getLiveActivity(limit = 30): Promise<any[]> {
    const result = await apiCall<any[]>(`/api/activity/live?limit=${limit}`);
    return result.data || [];
  },
};

// ==================== Notifications API ====================

export const NotificationsAPI = {
  /**
   * Get notifications
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{ data: any[]; total: number; unreadCount: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.unreadOnly) query.set('unreadOnly', 'true');
    
    const result = await apiCall<any>(`/api/notifications?${query}`);
    return {
      data: result.data?.data || [],
      total: result.data?.total || 0,
      unreadCount: result.data?.unreadCount || 0,
    };
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const result = await apiCall<{ count: number }>('/api/notifications/unread-count');
    return result.data?.count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const result = await apiCall<any>(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    return result.success;
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<boolean> {
    const result = await apiCall<any>('/api/notifications/read-all', {
      method: 'POST',
    });
    return result.success;
  },
};

// ==================== Leaderboard API ====================

export const LeaderboardAPI = {
  /**
   * Get season leaderboard
   */
  async getLeaderboard(params: {
    seasonId?: string;
    sortBy?: 'leaguePoints' | 'roi' | 'accuracy';
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: any[]; total: number; hasMore?: boolean }> {
    const query = new URLSearchParams();
    if (params.seasonId) query.set('seasonId', params.seasonId);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    
    const result = await apiCall<any>(`/api/analysts/leaderboard?${query}`);
    // Backend wraps: { data: { data: [...], total, hasMore } }
    const inner = result.data || {};
    return {
      data: inner.data || [],
      total: inner.total || 0,
      hasMore: inner.hasMore || false,
    };
  },

  /**
   * Get global leaderboard (all time)
   */
  async getGlobal(limit = 20): Promise<{ entries: any[]; total: number }> {
    const result = await apiCall<any>(`/api/leaderboard/global?limit=${limit}`);
    return result.data || { entries: [], total: 0 };
  },

  /**
   * Get weekly leaderboard
   */
  async getWeekly(limit = 20): Promise<{ entries: any[]; total: number }> {
    const result = await apiCall<any>(`/api/leaderboard/weekly?limit=${limit}`);
    return result.data || { entries: [], total: 0 };
  },

  /**
   * Get duels leaderboard
   */
  async getDuels(limit = 20): Promise<{ entries: any[]; total: number }> {
    const result = await apiCall<any>(`/api/leaderboard/duels?limit=${limit}`);
    return result.data || { entries: [], total: 0 };
  },

  /**
   * Get XP leaderboard
   */
  async getXp(limit = 20): Promise<{ entries: any[]; total: number }> {
    const result = await apiCall<any>(`/api/leaderboard/xp?limit=${limit}`);
    return result.data || { entries: [], total: 0 };
  },

  /**
   * Get profit leaderboard
   */
  async getProfitLeaderboard(params: {
    season?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.season) query.set('season', params.season);
    if (params.limit) query.set('limit', String(params.limit));
    
    const result = await apiCall<any[]>(`/api/leaderboard/profit?${query}`);
    return result.data || [];
  },

  /**
   * Get analyst profile
   */
  async getAnalyst(wallet: string): Promise<any | null> {
    const result = await apiCall<any>(`/api/analysts/${wallet}`);
    return result.data || null;
  },
};

// ==================== Seasons API ====================

export const SeasonsAPI = {
  /**
   * Get current season
   */
  async getCurrentSeason(): Promise<any | null> {
    const result = await apiCall<any>('/api/seasons/current');
    return result.data || null;
  },

  /**
   * Get all seasons
   */
  async getSeasons(): Promise<any[]> {
    const result = await apiCall<any[]>('/api/seasons');
    return result.data || [];
  },
};

// ==================== Duels API ====================

export const DuelsAPI = {
  async getDuels(params: {
    page?: number;
    limit?: number;
    status?: string;
    wallet?: string;
  } = {}): Promise<{ data: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.wallet) query.set('wallet', params.wallet);
    
    const result = await apiCall<any[]>(`/api/duels?${query}`);
    return { data: result.data || [], total: result.meta?.total || 0 };
  },

  async getOpenDuels(limit = 20): Promise<any[]> {
    const result = await apiCall<any[]>(`/api/duels/open?limit=${limit}`);
    return result.data || [];
  },

  async getDuelHistory(wallet: string, limit = 20): Promise<any[]> {
    const result = await apiCall<any[]>(`/api/duels/history?wallet=${wallet}&limit=${limit}`);
    return result.data || [];
  },

  async getDuelSummary(wallet: string): Promise<any> {
    const result = await apiCall<any>(`/api/duels/summary?wallet=${wallet}`);
    return result.data || {};
  },

  async getTopRivals(wallet: string, limit = 5): Promise<any[]> {
    const result = await apiCall<any[]>(`/api/duels/rivals?wallet=${wallet}&limit=${limit}`);
    return result.data || [];
  },

  async createDuel(data: {
    marketId: string;
    side: string;
    stakeAmount: number;
    opponentWallet?: string;
    predictionTitle?: string;
  }): Promise<{ success: boolean; duel?: any; error?: string }> {
    const result = await apiCall<any>('/api/duels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: result.success, duel: result.data, error: result.error };
  },

  async acceptDuel(duelId: string, wallet: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/duels/${duelId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ wallet }),
    });
    return { success: result.success, error: result.error };
  },

  async declineDuel(duelId: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/duels/${duelId}/decline`, {
      method: 'POST',
    });
    return { success: result.success, error: result.error };
  },
};

// ==================== Rivals API ====================

export interface RivalStats {
  opponent: string;
  totalDuels: number;
  wins: number;
  losses: number;
  lastWinner: string | null;
  lastDuelAt: string | null;
  currentStreakAgainstYou: number;
  currentStreakByYou: number;
  dominance: 'you' | 'them' | 'even';
  canRematch: boolean;
  lastStake: number;
}

export interface RivalrySummary {
  totalRivals: number;
  totalRivalryDuels: number;
  dominatedCount: number;
  dominatedByCount: number;
  longestStreak: number;
  topRival: RivalStats | null;
  nemesis: RivalStats | null;
}

export const RivalsAPI = {
  /**
   * Get all rivals for wallet
   */
  async getRivals(wallet: string): Promise<RivalStats[]> {
    const result = await apiCall<RivalStats[]>(`/api/rivals/${wallet}`);
    return result.data || [];
  },

  /**
   * Get rivalry summary
   */
  async getSummary(wallet: string): Promise<RivalrySummary | null> {
    const result = await apiCall<RivalrySummary>('/api/rivals/summary', {
      headers: { 'x-wallet-address': wallet },
    });
    return result.data || null;
  },

  /**
   * Get head-to-head stats
   */
  async getHeadToHead(wallet: string, opponent: string): Promise<{
    wallet: string;
    opponent: string;
    totalDuels: number;
    wins: number;
    losses: number;
    winRate: number;
    lastWinner: string | null;
    dominanceText: string;
    currentStreakCount: number;
  } | null> {
    const result = await apiCall<any>(`/api/rivals/${wallet}/${opponent}`);
    return result.data || null;
  },

  /**
   * Get top rival
   */
  async getTopRival(wallet: string): Promise<RivalStats | null> {
    const result = await apiCall<RivalStats>(`/api/rivals/${wallet}/top`);
    return result.data || null;
  },

  /**
   * Get nemesis
   */
  async getNemesis(wallet: string): Promise<RivalStats | null> {
    const result = await apiCall<RivalStats>(`/api/rivals/${wallet}/nemesis`);
    return result.data || null;
  },
};

// ==================== Market Drafts API ====================

export const MarketDraftsAPI = {
  async getConfig(): Promise<{ creationStake: number }> {
    const result = await apiCall<{ creationStake: number }>('/api/markets/drafts/config');
    return result.data || { creationStake: 100 };
  },

  async create(data: {
    title: string;
    description?: string;
    type?: string;
    outcomes: Array<{ id: string; label: string }>;
    category?: string;
    closeTime: string;
    resolutionType?: string;
    oracleConfig?: any;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const result = await apiCall<any>('/api/markets/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  },

  async getMyDrafts(): Promise<any[]> {
    const result = await apiCall<any[]>('/api/markets/drafts/my');
    return result.data || [];
  },

  async getDraft(id: string): Promise<any> {
    const result = await apiCall<any>(`/api/markets/drafts/${id}`);
    return result.data;
  },

  async submitForReview(id: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/markets/drafts/${id}/submit`, {
      method: 'POST',
    });
    return { success: result.success, error: result.error };
  },

  async cancelDraft(id: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/markets/drafts/${id}`, {
      method: 'DELETE',
    });
    return { success: result.success, error: result.error };
  },
};

// ==================== Oracle API ====================

export const OracleAPI = {
  async getPrice(asset: string): Promise<{ success: boolean; value?: number; error?: string }> {
    const result = await apiCall<{ value: number }>(`/api/markets/drafts/oracle/price/${asset}`);
    return { success: result.success, value: result.data?.value, error: result.error };
  },

  async evaluate(condition: {
    source: string;
    asset: string;
    operator: string;
    value: number;
  }): Promise<{ success: boolean; result?: boolean; actualValue?: number; error?: string }> {
    const res = await apiCall<any>('/api/markets/drafts/oracle/evaluate', {
      method: 'POST',
      body: JSON.stringify(condition),
    });
    return {
      success: res.success,
      result: res.data?.result,
      actualValue: res.data?.actualValue,
      error: res.error,
    };
  },
};

// ==================== Community Voting API ====================

export const VotingAPI = {
  async getActiveVotes(): Promise<any[]> {
    const result = await apiCall<any[]>('/api/markets/drafts/votes/active');
    return result.data || [];
  },

  async getVoteByMarket(marketId: string): Promise<any> {
    const result = await apiCall<any>(`/api/markets/drafts/votes/market/${marketId}`);
    return result.data;
  },

  async createDispute(marketId: string, data: {
    proposedOutcome: string;
    reason: string;
    durationHours?: number;
  }): Promise<{ success: boolean; vote?: any; error?: string }> {
    const result = await apiCall<any>(`/api/markets/drafts/votes/${marketId}/dispute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: result.success, vote: result.data, error: result.error };
  },

  async castVote(voteId: string, vote: string, nftTokenId?: string): Promise<{ success: boolean; error?: string }> {
    const result = await apiCall<any>(`/api/markets/drafts/votes/${voteId}/cast`, {
      method: 'POST',
      body: JSON.stringify({ vote, nftTokenId }),
    });
    return { success: result.success, error: result.error };
  },
};

// Export all APIs
export default {
  Wallet: WalletAPI,
  Markets: MarketsAPI,
  Positions: PositionsAPI,
  Marketplace: MarketplaceAPI,
  Activity: ActivityAPI,
  Notifications: NotificationsAPI,
  Leaderboard: LeaderboardAPI,
  Seasons: SeasonsAPI,
  Duels: DuelsAPI,
  Rivals: RivalsAPI,
  MarketDrafts: MarketDraftsAPI,
  Oracle: OracleAPI,
  Voting: VotingAPI,
};
