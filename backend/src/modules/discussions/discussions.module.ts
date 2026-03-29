import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { 
  DiscussionSchema, 
  DiscussionTopicSchema, 
  DiscussionCommentSchema 
} from './discussions.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ArenaUserSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Discussion', schema: DiscussionSchema },
      { name: 'DiscussionTopic', schema: DiscussionTopicSchema },
      { name: 'DiscussionComment', schema: DiscussionCommentSchema },
      { name: 'ArenaUser', schema: ArenaUserSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
