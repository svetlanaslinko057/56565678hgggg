import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { VotingService } from './voting.service';
import { NFTService } from './nft.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { VoteChoice } from './voting.schema';

class CastVoteDto {
  @IsEnum(VoteChoice)
  choice: VoteChoice;
}

class StartVotingDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // max 7 days
  durationHours?: number;
}

/**
 * Voting Controller - Community Voting System V2
 * 
 * Endpoints:
 * - POST /api/markets/:id/start-voting - Start voting period
 * - POST /api/markets/:id/vote - Cast a vote
 * - GET /api/markets/:id/voting-status - Get voting status
 * - POST /api/markets/:id/finalize-voting - Finalize voting
 * - GET /api/markets/:id/votes - Get all votes for a market
 * - POST /api/markets/:id/cancel-voting - Cancel voting (admin)
 * - GET /api/voting/stats - Get global voting statistics
 * - GET /api/voting/eligibility/:wallet - Check NFT eligibility
 */
@Controller()
export class VotingController {
  constructor(
    private readonly votingService: VotingService,
    private readonly nftService: NFTService,
  ) {}

  /**
   * Start voting for a disputed market
   * POST /api/markets/:id/start-voting
   */
  @Post('markets/:id/start-voting')
  async startVoting(
    @Param('id') marketId: string,
    @Body() dto: StartVotingDto,
  ) {
    const result = await this.votingService.startVoting(
      marketId,
      dto.durationHours || 24,
    );
    return ApiResponse.success(result, 'Voting started');
  }

  /**
   * Cast a vote on a disputed market
   * POST /api/markets/:id/vote
   */
  @Post('markets/:id/vote')
  async castVote(
    @Param('id') marketId: string,
    @Body() dto: CastVoteDto,
    @Headers('x-wallet-address') walletHeader?: string,
    @Body('wallet') walletBody?: string,
  ) {
    // Get wallet from header or body
    const wallet = walletHeader || walletBody;
    if (!wallet) {
      throw new BadRequestException('Wallet address required (x-wallet-address header or wallet in body)');
    }

    const result = await this.votingService.castVote(
      marketId,
      wallet.toLowerCase(),
      dto.choice,
    );
    return ApiResponse.success(result, 'Vote cast successfully');
  }

  /**
   * Get voting status for a market
   * GET /api/markets/:id/voting-status
   */
  @Get('markets/:id/voting-status')
  async getVotingStatus(
    @Param('id') marketId: string,
    @Query('wallet') wallet?: string,
  ) {
    const result = await this.votingService.getVotingStatus(marketId, wallet);
    return ApiResponse.success(result, 'Voting status retrieved');
  }

  /**
   * Finalize voting and resolve market
   * POST /api/markets/:id/finalize-voting
   */
  @Post('markets/:id/finalize-voting')
  async finalizeVoting(@Param('id') marketId: string) {
    const result = await this.votingService.finalizeVoting(marketId);
    return ApiResponse.success(result, 'Voting finalized');
  }

  /**
   * Get all votes for a market
   * GET /api/markets/:id/votes
   */
  @Get('markets/:id/votes')
  async getMarketVotes(
    @Param('id') marketId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.votingService.getMarketVotes(
      marketId,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
    return ApiResponse.success(result, 'Votes retrieved');
  }

  /**
   * Cancel voting (admin only)
   * POST /api/markets/:id/cancel-voting
   */
  @Post('markets/:id/cancel-voting')
  async cancelVoting(@Param('id') marketId: string) {
    const result = await this.votingService.cancelVoting(marketId);
    return ApiResponse.success(result, 'Voting canceled');
  }

  /**
   * Get global voting statistics
   * GET /api/voting/stats
   */
  @Get('voting/stats')
  async getVotingStats() {
    const result = await this.votingService.getVotingStats();
    return ApiResponse.success(result, 'Voting stats retrieved');
  }

  /**
   * Check NFT eligibility for voting
   * GET /api/voting/eligibility/:wallet
   * 
   * Returns detailed eligibility info:
   * - eligible: boolean (can vote)
   * - dbPositions: number of database positions
   * - onChainBalance: number of on-chain NFTs
   * - message: human-readable explanation
   */
  @Get('voting/eligibility/:wallet')
  async checkEligibility(@Param('wallet') wallet: string) {
    const details = await this.nftService.getEligibilityDetails(wallet);
    
    let message = '';
    if (details.eligible) {
      if (details.dbPositions > 0) {
        message = `You have ${details.dbPositions} active position(s) on the platform`;
      } else if (details.onChainBalance > 0) {
        message = `You hold ${details.onChainBalance} NFT(s) on-chain`;
      } else {
        message = 'You are eligible to vote';
      }
    } else {
      message = 'You need to hold an NFT or have an active position to vote. Place a bet on any market to become eligible.';
    }
    
    return ApiResponse.success({
      wallet: wallet.toLowerCase(),
      eligible: details.eligible,
      canVote: details.eligible,
      hasNFT: details.eligible,
      dbPositions: details.dbPositions,
      onChainBalance: details.onChainBalance,
      cached: details.cached,
      message,
    }, details.eligible ? 'Eligible to vote' : 'Not eligible to vote');
  }
}

/**
 * Alternative endpoints for predictions route
 * For backward compatibility with existing frontend
 */
@Controller('predictions')
export class PredictionVotingController {
  constructor(private readonly votingService: VotingService) {}

  /**
   * Get voting status (alternative route)
   * GET /api/predictions/:id/voting
   */
  @Get(':id/voting')
  async getVotingStatus(
    @Param('id') marketId: string,
    @Query('wallet') wallet?: string,
  ) {
    const status = await this.votingService.getVotingStatus(marketId, wallet);
    
    // Map to format expected by current frontend
    return ApiResponse.success({
      ...status,
      voteCounts: {
        yes: status.voting.yesVotes,
        no: status.voting.noVotes,
      },
      votePercentages: {
        yes: status.voting.totalVotes > 0 
          ? (status.voting.yesVotes / status.voting.totalVotes) * 100 
          : 50,
        no: status.voting.totalVotes > 0 
          ? (status.voting.noVotes / status.voting.totalVotes) * 100 
          : 50,
      },
      totalVotes: status.voting.totalVotes,
      isVotingOpen: status.voting.status === 'active',
      votingDeadline: status.voting.endsAt,
      disputeReason: status.disputeReason,
    }, 'Voting status');
  }

  /**
   * Cast a vote (alternative route)
   * POST /api/predictions/:id/vote
   */
  @Post(':id/vote')
  async castVote(
    @Param('id') marketId: string,
    @Body('wallet') wallet: string,
    @Body('outcomeId') outcomeId: string,
  ) {
    if (!wallet) {
      throw new BadRequestException('Wallet address required');
    }
    if (!outcomeId) {
      throw new BadRequestException('Outcome ID required');
    }

    // Map outcomeId to vote choice
    // Assuming: '1' or 'yes' = YES, '2' or 'no' = NO
    const choice = outcomeId === '1' || outcomeId.toLowerCase() === 'yes' 
      ? VoteChoice.YES 
      : VoteChoice.NO;

    const result = await this.votingService.castVote(
      marketId,
      wallet.toLowerCase(),
      choice,
    );
    return ApiResponse.success(result, 'Vote submitted');
  }
}
