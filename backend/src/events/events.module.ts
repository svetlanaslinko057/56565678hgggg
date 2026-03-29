import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationEventListener } from './notification-event-listener';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { RealtimeModule } from '../modules/realtime/realtime.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    NotificationsModule,
    RealtimeModule,
  ],
  providers: [NotificationEventListener],
  exports: [NotificationEventListener],
})
export class EventsModule {}
