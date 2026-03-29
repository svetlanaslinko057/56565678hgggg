import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VotingService } from './voting.service';

@Injectable()
export class VotingWorker {
  private readonly logger = new Logger(VotingWorker.name);

  constructor(private readonly votingService: VotingService) {}

  /**
   * Cron job: Check for expired votings every minute and finalize them
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processExpiredVotings(): Promise<void> {
    try {
      const markets = await this.votingService.getMarketsForVotingFinalization();

      if (markets.length === 0) {
        return;
      }

      this.logger.log(`Found ${markets.length} markets with expired voting periods`);

      for (const market of markets) {
        try {
          const marketId = (market as any)._id.toString();
          const result = await this.votingService.finalizeVoting(marketId);
          this.logger.log(
            `Auto-finalized voting for market ${marketId}: ${result.result}`
          );
        } catch (error) {
          this.logger.error(
            `Failed to finalize voting for market ${(market as any)._id}: ${error.message}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Voting worker error: ${error.message}`);
    }
  }

  /**
   * Manual trigger for voting finalization (admin use)
   */
  async triggerVotingFinalization(): Promise<{
    processed: number;
    results: any[];
  }> {
    const markets = await this.votingService.getMarketsForVotingFinalization();
    const results: any[] = [];

    for (const market of markets) {
      try {
        const marketId = (market as any)._id.toString();
        const result = await this.votingService.finalizeVoting(marketId);
        results.push({ marketId, success: true, result: result.result });
      } catch (error) {
        results.push({
          marketId: (market as any)._id.toString(),
          success: false,
          error: error.message,
        });
      }
    }

    return {
      processed: markets.length,
      results,
    };
  }
}
