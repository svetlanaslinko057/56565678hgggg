import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreatorReputation, CreatorReputationSchema } from './reputation.schema';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreatorReputation.name, schema: CreatorReputationSchema },
    ]),
  ],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
