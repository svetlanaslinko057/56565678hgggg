import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TickerService } from './ticker.service';
import { TickerItem } from './ticker.schema';

@Controller('ticker')
export class TickerController {
  constructor(private readonly tickerService: TickerService) {}

  // Public endpoint - get enabled ticker items with stats
  @Get()
  async getTickerItems() {
    const items = await this.tickerService.getTickerWithStats();
    return { success: true, data: items };
  }

  // Admin endpoints
  @Get('admin/all')
  async getAllItems() {
    const items = await this.tickerService.findAll();
    return { success: true, data: items };
  }

  @Get('admin/stats')
  async getStats() {
    const stats = await this.tickerService.getTickerStats();
    return { success: true, data: stats };
  }

  @Post('admin/create')
  async createItem(@Body() data: Partial<TickerItem>) {
    const item = await this.tickerService.create(data);
    return { success: true, data: item };
  }

  @Put('admin/:key')
  async updateItem(@Param('key') key: string, @Body() data: Partial<TickerItem>) {
    const item = await this.tickerService.update(key, data);
    return { success: true, data: item };
  }

  @Put('admin/:key/toggle')
  async toggleItem(@Param('key') key: string) {
    const item = await this.tickerService.toggleEnabled(key);
    return { success: true, data: item };
  }

  @Delete('admin/:key')
  async deleteItem(@Param('key') key: string) {
    const success = await this.tickerService.delete(key);
    return { success };
  }

  @Post('admin/reorder')
  async reorderItems(@Body() items: { key: string; order: number }[]) {
    await this.tickerService.reorder(items);
    return { success: true };
  }

  @Post('admin/reset')
  async resetToDefaults() {
    const items = await this.tickerService.resetToDefaults();
    return { success: true, data: items };
  }
}
