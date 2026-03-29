import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ActivityController } from './activity.controller';
import { IndexerModule } from '../indexer/indexer.module';

// Simple schema for activity events (from seed)
const ActivityEventSchema = new mongoose.Schema({
  eventName: String,
  user: String,
  username: String,
  marketId: String,
  marketTitle: String,
  amount: Number,
  outcomeId: String,
  timestamp: Date,
  createdAt: Date,
}, { collection: 'activityevents' });

@Module({
  imports: [
    IndexerModule,
    MongooseModule.forFeature([
      { name: 'ActivityEvent', schema: ActivityEventSchema },
    ]),
  ],
  controllers: [ActivityController],
})
export class ActivityModule {}
