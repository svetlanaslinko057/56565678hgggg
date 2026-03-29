import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { Season, SeasonSchema } from './seasons.schema';
import { SeasonStats, SeasonStatsSchema } from './season-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Season.name, schema: SeasonSchema },
      { name: SeasonStats.name, schema: SeasonStatsSchema },
    ]),
  ],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
