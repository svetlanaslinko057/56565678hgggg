import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { ResolutionService } from './resolution.service';
import { ResolutionController } from './resolution.controller';
import { ResolutionWorker } from './resolution.worker';
import { OracleEngine } from './engines/oracle.engine';
import { AdminEngine } from './engines/admin.engine';
import { CoingeckoProvider } from './providers/coingecko.provider';
import { LedgerModule } from '../ledger/ledger.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SeasonsModule } from '../seasons/seasons.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
    LedgerModule,
    UsersModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => SeasonsModule),
  ],
  controllers: [ResolutionController],
  providers: [
    ResolutionService,
    ResolutionWorker,
    OracleEngine,
    AdminEngine,
    CoingeckoProvider,
  ],
  exports: [ResolutionService, OracleEngine, CoingeckoProvider],
})
export class ResolutionModule {}
