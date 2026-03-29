/**
 * On-Chain API Client
 * Reads data from indexer mirror collections
 * This is the source of truth when ONCHAIN_ENABLED=true
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Generic API call
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; meta?: any }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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

// ==================== On-Chain Markets API ====================

export const OnchainMarketsAPI = {
  /**
   * Get on-chain markets from mirror
   */
  async getMarkets(params: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: 'createdAt' | 'trending' | 'volume' | 'bets';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ data: OnchainMarket[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const result = await apiCall<OnchainMarket[]>(`/api/onchain/markets?${queryParams}`);
    return {
      data: result.data || [],
      meta: result.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /**
   * Get single market by ID
   */
  async getMarket(marketId: number): Promise<OnchainMarket | null> {
    const result = await apiCall<OnchainMarket>(`/api/onchain/markets/${marketId}`);
    return result.data || null;
  },
  
  /**
   * Get FOMO pressure data for a market
   */
  async getMarketPressure(marketId: number): Promise<FomoData | null> {
    const result = await apiCall<FomoData>(`/api/onchain/markets/${marketId}/pressure`);
    return result.data || null;
  },
  
  /**
   * Get trending markets (sorted by FOMO score)
   */
  async getTrendingMarkets(limit: number = 10): Promise<OnchainMarket[]> {
    const result = await this.getMarkets({
      limit,
      sortBy: 'trending',
      sortOrder: 'desc',
    });
    return result.data;
  },
};

// ==================== On-Chain Positions API ====================

export const OnchainPositionsAPI = {
  /**
   * Get user positions from mirror
   */
  async getPositions(owner: string, params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: OnchainPosition[]; meta: any }> {
    const queryParams = new URLSearchParams();
    queryParams.append('owner', owner);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const result = await apiCall<OnchainPosition[]>(`/api/onchain/positions?${queryParams}`);
    return {
      data: result.data || [],
      meta: result.meta || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },

  /**
   * Get user token IDs
   */
  async getTokenIds(owner: string): Promise<number[]> {
    const result = await apiCall<number[]>(`/api/onchain/positions/tokens/${owner}`);
    return result.data || [];
  },
};

// ==================== On-Chain Activity API ====================

export const OnchainActivityAPI = {
  /**
   * Get activity feed from indexer
   */
  async getActivities(params: {
    type?: string;
    user?: string;
    marketId?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: OnchainActivity[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.user) queryParams.append('user', params.user);
    if (params.marketId) queryParams.append('marketId', params.marketId.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const result = await apiCall<OnchainActivity[]>(`/api/onchain/activities?${queryParams}`);
    return {
      data: result.data || [],
      meta: result.meta || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },
};

// ==================== On-Chain Leaderboard API ====================

export const OnchainLeaderboardAPI = {
  /**
   * Get leaderboard from on-chain positions
   */
  async getLeaderboard(limit: number = 20): Promise<OnchainLeaderboardEntry[]> {
    const result = await apiCall<OnchainLeaderboardEntry[]>(`/api/onchain/leaderboard?limit=${limit}`);
    return result.data || [];
  },
};

// ==================== On-Chain Stats API ====================

export const OnchainStatsAPI = {
  /**
   * Get on-chain statistics
   */
  async getStats(): Promise<OnchainStats> {
    const result = await apiCall<OnchainStats>('/api/onchain/stats');
    return result.data || {
      totalMarkets: 0,
      activeMarkets: 0,
      totalPositions: 0,
      claimedPositions: 0,
      totalVolume: 0,
    };
  },

  /**
   * Get indexer sync status
   */
  async getIndexerStatus(): Promise<IndexerStatus> {
    const result = await apiCall<IndexerStatus>('/api/onchain/indexer/status');
    return result.data || {
      lastSyncedBlock: 0,
      updatedAt: null,
      isRunning: false,
    };
  },
  
  /**
   * Get contract config from chain
   */
  async getContractConfig(): Promise<ContractConfig | null> {
    const result = await apiCall<ContractConfig>('/api/onchain/config');
    return result.data || null;
  },
};

// ==================== Types ====================

export interface FomoData {
  activity: {
    betsLast5Min: number;
    volumeLast5Min: number;
    totalBets: number;
    totalVolume: number;
  };
  sentiment: {
    yesPercent: number;
    noPercent: number;
    yesVolume: number;
    noVolume: number;
  };
  pressure: {
    level: 'low' | 'medium' | 'high';
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  flags: {
    isTrending: boolean;
    isHighActivity: boolean;
    isBullish: boolean;
    isBearish: boolean;
  };
  whales?: Array<{
    wallet: string;
    amount: number;
    side: 'yes' | 'no';
  }>;
  closing?: {
    time: string | null;
    inMinutes: number | null;
    isUrgent: boolean;
  };
}

export interface OnchainMarket {
  marketId: number;
  question: string;
  outcomeLabels: string[];
  outcomeCount: number;
  endTime: number;
  status: 'active' | 'locked' | 'resolved' | 'disputed' | 'cancelled';
  resolvedOutcome?: number;
  totalStaked: string;
  totalWinningStaked: string;
  createdAt: string;
  updatedAt: string;
  txHash: string;
  blockNumber: number;
  fomoData?: FomoData | null;
}

export interface OnchainPosition {
  tokenId: number;
  marketId: number;
  owner: string;
  outcome: number;
  amount: string;
  claimed: boolean;
  status: 'open' | 'won' | 'lost' | 'claimed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  txHash: string;
  blockNumber: number;
}

export interface OnchainActivity {
  type: 'bet_placed' | 'position_claimed' | 'position_refunded' | 'market_created' | 'market_resolved' | 'market_cancelled' | 'transfer';
  user: string;
  marketId?: number;
  tokenId?: number;
  amount?: string;
  outcome?: number;
  data: Record<string, any>;
  txHash: string;
  blockNumber: number;
  createdAt: string;
}

export interface OnchainLeaderboardEntry {
  rank: number;
  address: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  totalVolume: number;
}

export interface OnchainStats {
  totalMarkets: number;
  activeMarkets: number;
  totalPositions: number;
  claimedPositions: number;
  totalVolume: number;
}

export interface IndexerStatus {
  lastSyncedBlock: number;
  updatedAt: string | null;
  isRunning: boolean;
}

export interface ContractConfig {
  owner: string;
  claimFeeBps: number;
  feeRecipient: string;
  minBet: string;
  minBetFormatted: string;
  minInitialStake: string;
  minInitialStakeFormatted: string;
  stableToken: string;
  stableTokenDecimals: number;
  userMarketRequestsEnabled: boolean;
}
