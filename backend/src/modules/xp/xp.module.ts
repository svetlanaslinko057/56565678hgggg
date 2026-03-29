import { Module, forwardRef } from '@nestjs/common';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
