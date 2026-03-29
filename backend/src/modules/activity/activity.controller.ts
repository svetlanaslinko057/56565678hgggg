import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IndexerService } from '../indexer/indexer.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

// Schema for activity events from seed
interface ActivityEvent {
  eventName: string;
  user: string;
  username?: string;
  marketId: string;
  marketTitle?: string;
  amount?: number;
  outcomeId?: string;
  timestamp?: Date;
  createdAt?: Date;
}

interface LiveActivity {
  type: string;
  user: string;
  username?: string;
  market: string;
  side: string;
  stake: number;
  odds: number;
  createdAt: Date;
}

@Controller('activity')
export class ActivityController {
  constructor(
    private readonly indexerService: IndexerService,
    @InjectModel('ActivityEvent')
    private activityEventModel: Model<ActivityEvent>,
  ) {}

  /**
   * Get live activity feed
   * Returns formatted activity for frontend display
   * Uses seed activity events (chain events come when on-chain enabled)
   */
  @Get('live')
  async getLiveActivity(@Query('limit') limit?: number) {
    const activityLimit = limit || 30;
    
    // Always use seed activity events for now (until on-chain enabled)
    try {
      const seedEvents = await this.activityEventModel
        .find()
        .sort({ timestamp: -1, createdAt: -1 })
        .limit(activityLimit)
        .exec();
      
      if (seedEvents.length > 0) {
        const activities: LiveActivity[] = seedEvents.map(event => ({
          type: event.eventName === 'bet_placed' ? 'bet' : 
                event.eventName === 'position_listed' ? 'listing' :
                event.eventName === 'position_sold' ? 'sale' : 'activity',
          user: event.username || this.formatAddress(event.user || ''),
          market: event.marketTitle || event.marketId || 'Unknown Market',
          side: event.outcomeId?.toString() === 'yes' || event.outcomeId?.toString() === '0' ? 'Yes' : 'No',
          stake: event.amount || 0,
          odds: 2.0, // Default odds for seed data
          createdAt: event.timestamp || event.createdAt || new Date(),
        }));
        
        return ApiResponse.success(activities);
      }
    } catch (error) {
      // Fallback to chain events if activity model not available
    }
    
    // Fallback: Try chain events from indexer
    const chainEvents = await this.indexerService.getActivityFeed(activityLimit);
    
    if (chainEvents.length > 0) {
      // Transform chain events to activity format
      const activities: LiveActivity[] = chainEvents.map(event => ({
        type: event.type || 'bet',
        user: this.formatAddress(event.wallet || ''),
        market: event.marketId || 'Unknown Market',
        side: event.outcomeLabel || (event.outcomeId === 0 ? 'Yes' : 'No'),
        stake: event.stake || 0,
        odds: event.odds || 2.0,
        createdAt: event.timestamp,
      }));
      
      return ApiResponse.success(activities);
    }
    
    return ApiResponse.success([]);
  }

  /**
   * Format wallet address for display
   */
  private formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
