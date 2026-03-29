/**
 * Monetization API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface PricingInfo {
  betBoost: { base: number; description: string };
  duelFeatured: { base: number; description: string };
  platformFee: { base: number; dynamic: { low: number; medium: number; high: number } };
  duelFee: { base: number; dynamic: { low: number; high: number } };
  creatorFee: number;
}

export interface BoostResult {
  boostId: string;
  targetId: string;
  amount: number;
  expiresAt: string;
  featured?: boolean;
  benefits: string[];
}

export interface DynamicFee {
  marketId: string;
  fomoLevel: 'low' | 'medium' | 'high';
  platformFee: number;
  duelFee: number;
  creatorFee: number;
  factors: { volume: number; participants: number };
}

function getHeaders(wallet?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (wallet) headers['x-wallet-address'] = wallet;
  return headers;
}

export const MonetizationAPI = {
  async getPricing(): Promise<PricingInfo> {
    const response = await fetch(`${API_BASE}/api/monetization/pricing`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to get pricing');
    return result.data;
  },

  async boostBet(wallet: string, betId: string, boostAmount: number): Promise<BoostResult> {
    const response = await fetch(`${API_BASE}/api/monetization/boost/bet`, {
      method: 'POST',
      headers: getHeaders(wallet),
      body: JSON.stringify({ betId, boostAmount }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to boost bet');
    return result.data;
  },

  async featureDuel(wallet: string, duelId: string, boostAmount: number): Promise<BoostResult> {
    const response = await fetch(`${API_BASE}/api/monetization/boost/duel`, {
      method: 'POST',
      headers: getHeaders(wallet),
      body: JSON.stringify({ duelId, boostAmount }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to feature duel');
    return result.data;
  },

  async getBoostedBets(limit: number = 10): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/monetization/boosted/bets?limit=${limit}`);
    const result = await response.json();
    return result.data || [];
  },

  async getFeaturedDuels(limit: number = 5): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/monetization/featured/duels?limit=${limit}`);
    const result = await response.json();
    return result.data || [];
  },

  async getDynamicFee(marketId: string): Promise<DynamicFee> {
    const response = await fetch(`${API_BASE}/api/monetization/dynamic-fee/${marketId}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to get dynamic fee');
    return result.data;
  },

  async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/api/monetization/stats`);
    const result = await response.json();
    return result.data;
  },
};

export default MonetizationAPI;
