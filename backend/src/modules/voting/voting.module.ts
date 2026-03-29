import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VotingService } from './voting.service';
import { VotingController, PredictionVotingController } from './voting.controller';
import { VotingWorker } from './voting.worker';
import { DisputeVote, DisputeVoteSchema } from './voting.schema';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { NFTService } from './nft.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DisputeVote.name, schema: DisputeVoteSchema },
      { name: Prediction.name, schema: PredictionSchema },
    ]),
  ],
  controllers: [VotingController, PredictionVotingController],
  providers: [VotingService, VotingWorker, NFTService],
  exports: [VotingService, NFTService],
})
export class VotingModule {}
