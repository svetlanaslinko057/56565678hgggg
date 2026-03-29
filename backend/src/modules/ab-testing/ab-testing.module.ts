import { Module } from '@nestjs/common';
import { ABTestingService } from './ab-testing.service';
import { ABTestingController } from './ab-testing.controller';

@Module({
  controllers: [ABTestingController],
  providers: [ABTestingService],
  exports: [ABTestingService],
})
export class ABTestingModule {}
