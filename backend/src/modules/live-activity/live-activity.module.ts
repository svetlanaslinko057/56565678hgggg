import { Module } from '@nestjs/common';
import { LiveActivityGateway } from './live-activity.gateway';
import { LiveActivityController } from './live-activity.controller';

@Module({
  controllers: [LiveActivityController],
  providers: [LiveActivityGateway],
  exports: [LiveActivityGateway],
})
export class LiveActivityModule {}
