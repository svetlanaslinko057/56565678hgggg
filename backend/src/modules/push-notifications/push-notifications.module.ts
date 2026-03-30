import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushNotificationsService } from './push-notifications.service';
import { PushNotificationsController } from './push-notifications.controller';
import { 
  UserSubscriptions, 
  UserSubscriptionsSchema,
  PushNotificationLog,
  PushNotificationLogSchema,
} from './push-notifications.schema';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSubscriptions.name, schema: UserSubscriptionsSchema },
      { name: PushNotificationLog.name, schema: PushNotificationLogSchema },
    ]),
    forwardRef(() => TelegramBotModule),
  ],
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}
