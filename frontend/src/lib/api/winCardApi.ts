/**
 * Win Card API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface WinCardData {
  positionId: string;
  title: string;
  market: string;
  side: string;
  entry: number;
  payout: number;
  profit: number;
  roi: string;
  rival?: string;
  rivalDefeated?: boolean;
  streak?: number;
  isTopTen?: boolean;
  badge?: string;
  refLink: string;
  telegramShareUrl: string;
  shareText: string;
}

function getHeaders(wallet?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (wallet) headers['x-wallet-address'] = wallet;
  return headers;
}

export const WinCardAPI = {
  async getWinCardData(positionId: string, wallet: string): Promise<WinCardData> {
    const response = await fetch(`${API_BASE}/api/share/win/${positionId}`, { headers: getHeaders(wallet) });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to get win card data');
    return result.data;
  },

  async trackShare(positionId: string, wallet: string): Promise<{ tracked: boolean }> {
    const response = await fetch(`${API_BASE}/api/share/win/${positionId}/track`, {
      method: 'POST',
      headers: getHeaders(wallet),
    });
    const result = await response.json();
    return result.data;
  },

  async getRecentWins(wallet: string): Promise<WinCardData[]> {
    const response = await fetch(`${API_BASE}/api/share/wins/recent`, { headers: getHeaders(wallet) });
    const result = await response.json();
    return result.success ? result.data : [];
  },
};

export default WinCardAPI;
