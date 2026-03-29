import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TickerItem, TickerItemDocument } from './ticker.schema';

const DEFAULT_TICKER_ITEMS = [
  { key: 'hot_markets', label: 'Hot Markets', icon: 'fire', color: '#f97316', enabled: true, order: 1, value: '12', changeValue: '+3', changePositive: true, isDynamic: true, dynamicSource: 'hotMarkets' },
  { key: 'total_volume', label: 'Total Volume', icon: 'volume', color: '#22c55e', enabled: true, order: 2, value: '$847K', changeValue: '+12%', changePositive: true, isDynamic: true, dynamicSource: 'totalVolume' },
  { key: 'active_bets', label: 'Active Bets', icon: 'target', color: '#3b82f6', enabled: true, order: 3, value: '1,247', changeValue: '+89', changePositive: true, isDynamic: true, dynamicSource: 'activeBets' },
  { key: 'predictors', label: 'Predictors', icon: 'users', color: '#a855f7', enabled: true, order: 4, value: '3,891', changeValue: '+156', changePositive: true, isDynamic: true, dynamicSource: 'totalUsers' },
  { key: 'top_win', label: 'Top Win', icon: 'trophy', color: '#eab308', enabled: true, order: 5, value: '$12.4K', changeValue: null, changePositive: true, isDynamic: true, dynamicSource: 'topWin' },
  { key: 'win_rate', label: 'Win Rate Avg', icon: 'chart', color: '#06b6d4', enabled: true, order: 6, value: '54.2%', changeValue: '-1.2%', changePositive: false, isDynamic: true, dynamicSource: 'avgWinRate' },
  { key: 'ending_soon', label: 'Ending Soon', icon: 'clock', color: '#ec4899', enabled: true, order: 7, value: '8', changeValue: null, changePositive: true, isDynamic: true, dynamicSource: 'endingSoon' },
  { key: 'new_today', label: 'New Today', icon: 'star', color: '#f59e0b', enabled: true, order: 8, value: '5', changeValue: '+2', changePositive: true, isDynamic: true, dynamicSource: 'newToday' },
  { key: 'hot_streak', label: 'Hot Streak', icon: 'flame', color: '#10b981', enabled: true, order: 9, value: '7 wins', changeValue: null, changePositive: true, isDynamic: false, dynamicSource: null },
];

@Injectable()
export class TickerService implements OnModuleInit {
  constructor(
    @InjectModel(TickerItem.name) private tickerModel: Model<TickerItemDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultItems();
  }

  private async seedDefaultItems() {
    const count = await this.tickerModel.countDocuments();
    if (count === 0) {
      await this.tickerModel.insertMany(DEFAULT_TICKER_ITEMS);
      console.log('✅ Ticker items seeded');
    }
  }

  async findAll(): Promise<TickerItem[]> {
    return this.tickerModel.find().sort({ order: 1 }).lean().exec();
  }

  async findEnabled(): Promise<TickerItem[]> {
    return this.tickerModel.find({ enabled: true }).sort({ order: 1 }).lean().exec();
  }

  async findOne(key: string): Promise<TickerItem> {
    return this.tickerModel.findOne({ key }).lean().exec();
  }

  async create(data: Partial<TickerItem>): Promise<TickerItem> {
    const item = new this.tickerModel(data);
    return item.save();
  }

  async update(key: string, data: Partial<TickerItem>): Promise<TickerItem> {
    return this.tickerModel.findOneAndUpdate(
      { key },
      { $set: data },
      { new: true }
    ).lean().exec();
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.tickerModel.deleteOne({ key });
    return result.deletedCount > 0;
  }

  async toggleEnabled(key: string): Promise<TickerItem> {
    const item = await this.tickerModel.findOne({ key });
    if (item) {
      item.enabled = !item.enabled;
      return item.save();
    }
    return null;
  }

  async reorder(items: { key: string; order: number }[]): Promise<boolean> {
    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { key: item.key },
        update: { $set: { order: item.order } }
      }
    }));
    await this.tickerModel.bulkWrite(bulkOps);
    return true;
  }

  async resetToDefaults(): Promise<TickerItem[]> {
    await this.tickerModel.deleteMany({});
    await this.tickerModel.insertMany(DEFAULT_TICKER_ITEMS);
    return this.findAll();
  }

  // Get dynamic stats for ticker
  async getTickerStats(): Promise<Record<string, any>> {
    // This would normally fetch from various services
    // For now, return mock data that can be replaced with real queries
    return {
      hotMarkets: { value: '12', change: '+3' },
      totalVolume: { value: '$847K', change: '+12%' },
      activeBets: { value: '1,247', change: '+89' },
      totalUsers: { value: '3,891', change: '+156' },
      topWin: { value: '$12.4K', change: null },
      avgWinRate: { value: '54.2%', change: '-1.2%', positive: false },
      endingSoon: { value: '8', change: null },
      newToday: { value: '5', change: '+2' },
    };
  }

  // Get ticker items with dynamic values populated
  async getTickerWithStats(): Promise<any[]> {
    const items = await this.findEnabled();
    const stats = await this.getTickerStats();
    
    return items.map(item => {
      if (item.isDynamic && item.dynamicSource && stats[item.dynamicSource]) {
        const stat = stats[item.dynamicSource];
        return {
          ...item,
          value: stat.value,
          changeValue: stat.change,
          changePositive: stat.positive !== undefined ? stat.positive : true,
        };
      }
      return item;
    });
  }
}
