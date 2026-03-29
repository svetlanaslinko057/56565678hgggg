import { Module, forwardRef } from '@nestjs/common';
import { MirrorController } from './mirror.controller';
import { MirrorService } from './mirror.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { XpModule } from '../xp/xp.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => XpModule),
  ],
  controllers: [MirrorController],
  providers: [MirrorService],
  exports: [MirrorService],
})
export class MirrorModule {}
