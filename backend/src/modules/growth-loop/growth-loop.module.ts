import { Module } from '@nestjs/common';
import { GrowthLoopService } from './growth-loop.service';
import { GrowthLoopController } from './growth-loop.controller';

@Module({
  controllers: [GrowthLoopController],
  providers: [GrowthLoopService],
  exports: [GrowthLoopService],
})
export class GrowthLoopModule {}
