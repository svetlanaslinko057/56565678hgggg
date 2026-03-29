import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { BoostSchema } from './boost.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { Duel, DuelSchema } from '../duels/duels.schema';
import { Analyst, AnalystSchema } from '../analysts/analysts.schema';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Boost', schema: BoostSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Duel.name, schema: DuelSchema },
      { name: Analyst.name, schema: AnalystSchema },
      { name: Prediction.name, schema: PredictionSchema },
    ]),
  ],
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
