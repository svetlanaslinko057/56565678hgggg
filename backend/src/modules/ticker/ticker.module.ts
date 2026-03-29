import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TickerController } from './ticker.controller';
import { TickerService } from './ticker.service';
import { TickerItem, TickerItemSchema } from './ticker.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TickerItem.name, schema: TickerItemSchema },
    ]),
  ],
  controllers: [TickerController],
  providers: [TickerService],
  exports: [TickerService],
})
export class TickerModule {}
