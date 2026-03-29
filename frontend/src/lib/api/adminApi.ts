/**
 * Admin API Client
 * Handles all API calls to Admin endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Admin token storage
const ADMIN_WALLET_KEY = 'arena_admin_wallet';

function getAdminWallet(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_WALLET_KEY) || 'admin';
}

export function setAdminWallet(wallet: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_WALLET_KEY, wallet);
  }
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-wallet': getAdminWallet() || 'admin',
  };
}

async function adminCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; total?: number }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ==================== Stats ====================

export const AdminStatsAPI = {
  async getStats() {
    return adminCall<any>('/api/admin/stats');
  },
};

// ==================== Markets ====================

export const AdminMarketsAPI = {
  async getMarkets(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    
    return adminCall<any[]>(`/api/admin/markets?${query}`);
  },

  async getMarket(id: string) {
    return adminCall<any>(`/api/admin/markets/${id}`);
  },

  async getPendingMarkets() {
    return adminCall<any[]>('/api/admin/markets/pending');
  },

  async createMarket(data: {
    title: string;
    description?: string;
    category: string;
    outcomes: { id: string; label: string }[];
    closeTime: Date;
    initialLiquidity?: number;
    riskLevel?: string;
  }) {
    return adminCall<any>('/api/admin/markets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMarket(id: string, data: any) {
    return adminCall<any>(`/api/admin/markets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async approveMarket(id: string) {
    return adminCall<any>(`/api/admin/markets/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectMarket(id: string, reason?: string) {
    return adminCall<any>(`/api/admin/markets/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async lockMarket(id: string) {
    return adminCall<any>(`/api/admin/markets/${id}/lock`, {
      method: 'POST',
    });
  },

  async resolveMarket(id: string, winningOutcome: string, resolutionNote?: string) {
    return adminCall<any>(`/api/admin/markets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ winningOutcome, resolutionNote }),
    });
  },

  async simulateMarket(id: string, outcomeId: string) {
    return adminCall<any>(`/api/admin/markets/${id}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ outcomeId }),
    });
  },

  async deleteMarket(id: string) {
    return adminCall<any>(`/api/admin/markets/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Users ====================

export const AdminUsersAPI = {
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    
    return adminCall<any[]>(`/api/admin/users?${query}`);
  },

  async getUser(id: string) {
    return adminCall<any>(`/api/admin/users/${id}`);
  },

  async updateUser(id: string, data: any) {
    return adminCall<any>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async banUser(id: string) {
    return adminCall<any>(`/api/admin/users/${id}/ban`, {
      method: 'POST',
    });
  },

  async unbanUser(id: string) {
    return adminCall<any>(`/api/admin/users/${id}/unban`, {
      method: 'POST',
    });
  },
};

// ==================== Positions ====================

export const AdminPositionsAPI = {
  async getPositions(params: {
    page?: number;
    limit?: number;
    status?: string;
    marketId?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.marketId) query.set('marketId', params.marketId);
    
    return adminCall<any[]>(`/api/admin/positions?${query}`);
  },
};

// ==================== Duels ====================

export const AdminDuelsAPI = {
  async getDuels(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    
    return adminCall<any[]>(`/api/admin/duels?${query}`);
  },

  async resolveDuel(id: string, winnerId: string) {
    return adminCall<any>(`/api/admin/duels/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ winnerId }),
    });
  },

  async cancelDuel(id: string) {
    return adminCall<any>(`/api/admin/duels/${id}/cancel`, {
      method: 'POST',
    });
  },
};

// ==================== Seasons ====================

export const AdminSeasonsAPI = {
  async getSeasons() {
    return adminCall<any[]>('/api/admin/seasons');
  },

  async createSeason(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
  }) {
    return adminCall<any>('/api/admin/seasons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async startSeason(id: string) {
    return adminCall<any>(`/api/admin/seasons/${id}/start`, {
      method: 'POST',
    });
  },

  async endSeason(id: string) {
    return adminCall<any>(`/api/admin/seasons/${id}/end`, {
      method: 'POST',
    });
  },
};

// ==================== Activity & Risk ====================

export const AdminActivityAPI = {
  async getActivity(limit = 50) {
    return adminCall<any[]>(`/api/admin/activity?limit=${limit}`);
  },
};

export const AdminRiskAPI = {
  async getRiskMonitor() {
    return adminCall<any[]>('/api/admin/risk/markets');
  },
};

export default {
  Stats: AdminStatsAPI,
  Markets: AdminMarketsAPI,
  Users: AdminUsersAPI,
  Positions: AdminPositionsAPI,
  Duels: AdminDuelsAPI,
  Seasons: AdminSeasonsAPI,
  Activity: AdminActivityAPI,
  Risk: AdminRiskAPI,
};
