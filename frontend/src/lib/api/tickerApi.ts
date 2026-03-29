const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface TickerItem {
  _id?: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  order: number;
  value: string;
  changeValue: string | null;
  changePositive: boolean;
  isDynamic: boolean;
  dynamicSource: string | null;
}

// Get headers with auth
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  return headers;
}

export const TickerAPI = {
  // Public
  async getItems(): Promise<TickerItem[]> {
    const response = await fetch(`${API_BASE}/api/ticker`);
    const data = await response.json();
    return data.data;
  },

  // Admin
  async getAllItems(): Promise<TickerItem[]> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/all`);
    const data = await response.json();
    return data.data;
  },

  async getStats(): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/stats`);
    const data = await response.json();
    return data.data;
  },

  async createItem(item: Partial<TickerItem>): Promise<TickerItem> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return data.data;
  },

  async updateItem(key: string, item: Partial<TickerItem>): Promise<TickerItem> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/${key}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return data.data;
  },

  async toggleItem(key: string): Promise<TickerItem> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/${key}/toggle`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data.data;
  },

  async deleteItem(key: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/${key}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data.success;
  },

  async reorderItems(items: { key: string; order: number }[]): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/reorder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(items),
    });
    const data = await response.json();
    return data.success;
  },

  async resetToDefaults(): Promise<TickerItem[]> {
    const response = await fetch(`${API_BASE}/api/ticker/admin/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data.data;
  },
};
