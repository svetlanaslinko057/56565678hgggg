import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { MirrorService } from './mirror.service';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { Position, PositionSchema } from '../positions/positions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
  ],
  controllers: [IndexerController],
  providers: [IndexerService, MirrorService],
  exports: [IndexerService, MirrorService],
})
export class IndexerModule {}
