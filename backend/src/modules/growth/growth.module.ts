import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserStreak, UserStreakSchema } from './streak.schema';
import { AnalystProfile, AnalystProfileSchema } from './analyst.schema';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserStreak.name, schema: UserStreakSchema },
      { name: AnalystProfile.name, schema: AnalystProfileSchema },
    ]),
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
