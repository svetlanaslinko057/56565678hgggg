import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from './positions.schema';
import { PositionsService } from './positions.service';
import { PositionsController, BettingController } from './positions.controller';
import { PredictionsModule } from '../predictions/predictions.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule } from '../ledger/ledger.module';
import { LiquidityModule } from '../liquidity/liquidity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Position.name, schema: PositionSchema },
    ]),
    forwardRef(() => PredictionsModule),
    UsersModule,
    AuthModule,
    forwardRef(() => NotificationsModule),
    LedgerModule,
    LiquidityModule,
  ],
  controllers: [PositionsController, BettingController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}
