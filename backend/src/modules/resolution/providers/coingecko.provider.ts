/**
 * CoinGecko Provider for Oracle Resolution Engine
 * Fetches price data and market metrics from CoinGecko API
 */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface CoinMarketData {
  price?: number;
  marketCap?: number;
  fdv?: number;
  volume24h?: number;
  priceChange24h?: number;
  lastUpdated?: string;
}

@Injectable()
export class CoingeckoProvider {
  private readonly logger = new Logger(CoingeckoProvider.name);
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  // Common asset ID mappings
  private readonly assetMappings: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'bnb': 'binancecoin',
    'xrp': 'ripple',
    'ada': 'cardano',
    'doge': 'dogecoin',
    'dot': 'polkadot',
    'avax': 'avalanche-2',
    'matic': 'matic-network',
    'link': 'chainlink',
    'uni': 'uniswap',
    'atom': 'cosmos',
    'ltc': 'litecoin',
    'near': 'near',
    'apt': 'aptos',
    'arb': 'arbitrum',
    'op': 'optimism',
  };

  private normalizeAssetId(asset: string): string {
    const normalized = asset.toLowerCase().trim();
    return this.assetMappings[normalized] || normalized;
  }

  async getPrice(asset: string, vsCurrency = 'usd'): Promise<number | null> {
    try {
      const assetId = this.normalizeAssetId(asset);
      const url = `${this.baseUrl}/simple/price`;
      
      const { data } = await axios.get(url, {
        params: {
          ids: assetId,
          vs_currencies: vsCurrency,
        },
        timeout: 10000,
      });

      const value = data?.[assetId]?.[vsCurrency];
      this.logger.debug(`CoinGecko price for ${assetId}: ${value}`);
      return typeof value === 'number' ? value : null;
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${asset}: ${error.message}`);
      return null;
    }
  }

  async getCoinMarketData(asset: string): Promise<CoinMarketData | null> {
    try {
      const assetId = this.normalizeAssetId(asset);
      const url = `${this.baseUrl}/coins/${assetId}`;
      
      const { data } = await axios.get(url, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
        timeout: 15000,
      });

      const marketData = data?.market_data;
      if (!marketData) {
        return null;
      }

      return {
        price: marketData.current_price?.usd,
        marketCap: marketData.market_cap?.usd,
        fdv: marketData.fully_diluted_valuation?.usd,
        volume24h: marketData.total_volume?.usd,
        priceChange24h: marketData.price_change_percentage_24h,
        lastUpdated: data.last_updated,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch market data for ${asset}: ${error.message}`);
      return null;
    }
  }

  async getMetricValue(
    asset: string,
    metric: 'price' | 'fdv' | 'market_cap' | 'volume_24h'
  ): Promise<number | null> {
    if (metric === 'price') {
      return this.getPrice(asset);
    }

    const data = await this.getCoinMarketData(asset);
    if (!data) {
      return null;
    }

    switch (metric) {
      case 'fdv':
        return data.fdv ?? null;
      case 'market_cap':
        return data.marketCap ?? null;
      case 'volume_24h':
        return data.volume24h ?? null;
      default:
        return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/ping`, { timeout: 5000 });
      return data?.gecko_says === '(V3) To the Moon!';
    } catch {
      return false;
    }
  }
}
