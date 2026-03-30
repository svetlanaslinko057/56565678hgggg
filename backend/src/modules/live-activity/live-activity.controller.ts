import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LiveActivityGateway } from './live-activity.gateway';

@ApiTags('Live Activity')
@Controller('live')
export class LiveActivityController {
  constructor(private readonly liveGateway: LiveActivityGateway) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get live activity stats' })
  getStats() {
    return {
      success: true,
      data: this.liveGateway.getStats(),
    };
  }
}
