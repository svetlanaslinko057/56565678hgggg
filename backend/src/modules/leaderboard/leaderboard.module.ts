import { Module } from '@nestjs/common';
import { LeaderboardController, AnalystsLeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { SeasonsModule } from '../seasons/seasons.module';

@Module({
  imports: [SeasonsModule],
  controllers: [LeaderboardController, AnalystsLeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
