import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FomoEngineService, FomoEvent } from './fomo-engine.service';

@ApiTags('FOMO Engine')
@Controller('fomo')
export class FomoEngineController {
  constructor(private readonly fomoService: FomoEngineService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get active FOMO events' })
  @ApiQuery({ name: 'marketId', required: false })
  getEvents(@Query('marketId') marketId?: string): {
    success: boolean;
    data: FomoEvent[];
  } {
    const events = this.fomoService.getActiveEvents(marketId);
    return {
      success: true,
      data: events,
    };
  }

  @Get('best-signal')
  @ApiOperation({ summary: 'Get best FOMO signal' })
  getBestSignal(): {
    success: boolean;
    data: FomoEvent | null;
  } {
    const signal = this.fomoService.getBestSignal();
    return {
      success: true,
      data: signal,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get FOMO engine stats' })
  getStats(): {
    success: boolean;
    data: {
      activeEvents: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    };
  } {
    const events = this.fomoService.getActiveEvents();
    
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      byPriority[event.priority] = (byPriority[event.priority] || 0) + 1;
    }
    
    return {
      success: true,
      data: {
        activeEvents: events.length,
        byType,
        byPriority,
      },
    };
  }
}
