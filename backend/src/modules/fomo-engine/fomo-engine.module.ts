import { Module } from '@nestjs/common';
import { FomoEngineService } from './fomo-engine.service';
import { FomoEngineController } from './fomo-engine.controller';

@Module({
  controllers: [FomoEngineController],
  providers: [FomoEngineService],
  exports: [FomoEngineService],
})
export class FomoEngineModule {}
