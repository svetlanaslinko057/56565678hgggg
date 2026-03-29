import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';
import { ResolutionModule } from '../resolution/resolution.module';
import { DuelsModule } from '../duels/duels.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
    ]),
    forwardRef(() => ResolutionModule),
    forwardRef(() => DuelsModule),
  ],
  controllers: [OracleController],
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
