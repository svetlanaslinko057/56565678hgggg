import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prediction, PredictionSchema } from './predictions.schema';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
    ]),
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
