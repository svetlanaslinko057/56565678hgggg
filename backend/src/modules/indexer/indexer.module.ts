import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { OnchainController } from './onchain.controller';
import { MirrorService } from './mirror.service';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
    forwardRef(() => EconomyModule),
  ],
  controllers: [IndexerController, OnchainController],
  providers: [IndexerService, MirrorService],
  exports: [IndexerService, MirrorService],
})
export class IndexerModule {}
