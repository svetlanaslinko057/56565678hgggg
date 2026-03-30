import { Module, forwardRef } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';
import { XpModule } from '../xp/xp.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => XpModule), 
    forwardRef(() => NotificationsModule),
  ],
  controllers: [EconomyController],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
