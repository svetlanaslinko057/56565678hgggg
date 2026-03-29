import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DuelsController } from './duels.controller';
import { DuelsService } from './duels.service';
import { DuelResolutionService } from './duel-resolution.service';
import { Duel, DuelSchema } from './duels.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule } from '../ledger/ledger.module';
import { UsersModule } from '../users/users.module';
import { RivalsModule } from '../rivals/rivals.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Duel.name, schema: DuelSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => LedgerModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RivalsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [DuelsController],
  providers: [DuelsService, DuelResolutionService],
  exports: [DuelsService, DuelResolutionService],
})
export class DuelsModule {}
