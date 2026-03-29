import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { OddsSnapshot, OddsSnapshotSchema } from './odds-snapshot.schema';
import { IndexerModule } from '../indexer/indexer.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { LiquidityModule } from '../liquidity/liquidity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OddsSnapshot.name, schema: OddsSnapshotSchema },
    ]),
    IndexerModule, 
    PredictionsModule, 
    LiquidityModule,
  ],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
