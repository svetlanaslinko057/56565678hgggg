import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketLiquidity, MarketLiquiditySchema } from './liquidity.schema';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { OddsSnapshot, OddsSnapshotSchema } from './odds-snapshot.schema';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketLiquidity.name, schema: MarketLiquiditySchema },
      { name: Prediction.name, schema: PredictionSchema },
      { name: OddsSnapshot.name, schema: OddsSnapshotSchema },
    ]),
  ],
  controllers: [LiquidityController],
  providers: [LiquidityService],
  exports: [LiquidityService],
})
export class LiquidityModule {}
