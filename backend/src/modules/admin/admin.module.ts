import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { Analyst, AnalystSchema } from '../analysts/analysts.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { Duel, DuelSchema } from '../duels/duels.schema';
import { Season, SeasonSchema } from '../seasons/seasons.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
      { name: Analyst.name, schema: AnalystSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Duel.name, schema: DuelSchema },
      { name: Season.name, schema: SeasonSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
