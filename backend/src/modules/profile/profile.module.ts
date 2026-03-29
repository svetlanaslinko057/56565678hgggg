import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ArenaUserSchema } from '../users/users.schema';
import { PositionSchema } from '../positions/positions.schema';
import { PredictionSchema } from '../predictions/predictions.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

// Activity Event Schema (inline for simplicity)
import { Schema } from 'mongoose';
const ActivityEventSchema = new Schema({
  eventName: String,
  user: String,
  username: String,
  marketId: String,
  marketTitle: String,
  amount: Number,
  outcomeId: String,
  timestamp: Date,
}, { timestamps: true });

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: 'ArenaUser', schema: ArenaUserSchema },
      { name: 'Position', schema: PositionSchema },
      { name: 'Prediction', schema: PredictionSchema },
      { name: 'ActivityEvent', schema: ActivityEventSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
