/**
 * Share API Client
 * Handles shareable bet slips and referrals
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface ShareData {
  shareId: string;
  marketTitle: string;
  marketCategory: string;
  outcomeLabel: string;
  stake: number;
  odds: number;
  status: 'open' | 'won' | 'lost';
  payout: number;
  roi: string;
  verified: boolean;
  ref: string;
  creatorName: string;
  creatorAvatar: string;
  createdAt: string;
  clickCount: number;
}

export interface ShareStats {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  referralsCount: number;
  conversionRate: string;
}

function getHeaders(wallet?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (wallet) {
    headers['x-wallet-address'] = wallet;
  }
  return headers;
}

export const ShareAPI = {
  /**
   * Create share link for a position
   */
  async createShareLink(positionId: string, wallet: string): Promise<{ shareId: string; url: string }> {
    const response = await fetch(`${API_BASE}/api/share/position/${positionId}`, {
      method: 'POST',
      headers: getHeaders(wallet),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create share link');
    return result.data;
  },

  /**
   * Get share data for landing page
   */
  async getShareData(shareId: string): Promise<ShareData> {
    const response = await fetch(`${API_BASE}/api/share/${shareId}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Share link not found');
    return result.data;
  },

  /**
   * Track referral conversion
   */
  async trackReferral(shareId: string, newUserWallet: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/share/track-referral`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shareId, newUserWallet }),
    });
    const result = await response.json();
    return result.data;
  },

  /**
   * Award referral bonus after qualifying bet
   */
  async awardReferralBonus(wallet: string, stakeAmount: number): Promise<any> {
    const response = await fetch(`${API_BASE}/api/share/award-bonus`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ wallet, stakeAmount }),
    });
    const result = await response.json();
    return result.data;
  },

  /**
   * Get user's share statistics
   */
  async getMyShareStats(wallet: string): Promise<ShareStats> {
    const response = await fetch(`${API_BASE}/api/share/stats/me`, {
      headers: getHeaders(wallet),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to get stats');
    return result.data;
  },

  /**
   * Get top referrers leaderboard
   */
  async getTopReferrers(limit: number = 10): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/share/leaderboard/referrers?limit=${limit}`);
    const result = await response.json();
    return result.data || [];
  },
};

// Helper to save referral to localStorage
export function saveReferralToStorage(shareId: string, refWallet: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('arena_ref_share_id', shareId);
    localStorage.setItem('arena_ref_wallet', refWallet);
    localStorage.setItem('arena_ref_timestamp', String(Date.now()));
  }
}

// Helper to get referral from localStorage
export function getReferralFromStorage(): { shareId: string; refWallet: string } | null {
  if (typeof window === 'undefined') return null;
  
  const shareId = localStorage.getItem('arena_ref_share_id');
  const refWallet = localStorage.getItem('arena_ref_wallet');
  const timestamp = localStorage.getItem('arena_ref_timestamp');
  
  if (!shareId || !refWallet || !timestamp) return null;
  
  // Check if referral is still valid (30 days)
  const age = Date.now() - parseInt(timestamp);
  if (age > 30 * 24 * 60 * 60 * 1000) {
    clearReferralFromStorage();
    return null;
  }
  
  return { shareId, refWallet };
}

// Helper to clear referral
export function clearReferralFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('arena_ref_share_id');
    localStorage.removeItem('arena_ref_wallet');
    localStorage.removeItem('arena_ref_timestamp');
  }
}

export default ShareAPI;
