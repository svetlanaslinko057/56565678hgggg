/**
 * Resolution Worker - Scheduled job for automatic market resolution
 * Runs every minute to check and resolve eligible markets
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResolutionService } from './resolution.service';

@Injectable()
export class ResolutionWorker {
  private readonly logger = new Logger(ResolutionWorker.name);
  private isRunning = false;

  constructor(private readonly resolutionService: ResolutionService) {}

  /**
   * Main resolution tick - runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleResolutionTick() {
    if (this.isRunning) {
      this.logger.debug('Resolution worker already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.debug('Resolution worker tick started');

    try {
      // Get markets that need resolution
      const marketsToCheck = await this.resolutionService.getMarketsForOracleResolution();
      
      if (marketsToCheck.length === 0) {
        this.logger.debug('No markets pending oracle resolution');
        return;
      }

      this.logger.log(`Found ${marketsToCheck.length} markets for oracle resolution`);

      for (const market of marketsToCheck) {
        try {
          const marketId = (market as any)._id.toString();
          
          // Evaluate market
          const evaluation = await this.resolutionService.evaluateMarketForOracle(market);
          
          // Apply resolution
          await this.resolutionService.finalizeOracleResolution(marketId, evaluation);
          
          this.logger.log(
            `Processed market ${marketId}: ${evaluation.status} → ${evaluation.outcome || 'pending'}`
          );
        } catch (error) {
          this.logger.error(
            `Failed to process market ${(market as any)._id}: ${error.message}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Resolution worker tick failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for resolution (for testing/admin use)
   */
  async triggerResolution(): Promise<{
    processed: number;
    results: any[];
  }> {
    const marketsToCheck = await this.resolutionService.getMarketsForOracleResolution();
    const results: any[] = [];

    for (const market of marketsToCheck) {
      try {
        const marketId = (market as any)._id.toString();
        const evaluation = await this.resolutionService.evaluateMarketForOracle(market);
        const result = await this.resolutionService.finalizeOracleResolution(marketId, evaluation);
        results.push(result);
      } catch (error) {
        results.push({
          marketId: (market as any)._id.toString(),
          error: error.message,
        });
      }
    }

    return {
      processed: marketsToCheck.length,
      results,
    };
  }
}
