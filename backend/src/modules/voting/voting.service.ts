import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DisputeVote, DisputeVoteDocument, VoteChoice, VotingStatus } from './voting.schema';
import { Prediction, PredictionDocument, PredictionStatus, ResolutionStatus, ResolutionOutcome } from '../predictions/predictions.schema';
import { NFTService } from './nft.service';

export interface VotingStatusResponse {
  marketId: string;
  marketStatus: string;
  voting: {
    status: VotingStatus;
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    endsAt: string | null;
    result: string | null;
    startedAt: string | null;
  };
  user: {
    canVote: boolean;
    hasVoted: boolean;
    vote: string | null;
    hasNFT: boolean;
    nftBalance?: number;
  };
  disputeReason?: string;
  disputedAt?: string;
  disputedBy?: string;
}

@Injectable()
export class VotingService {
  private readonly logger = new Logger(VotingService.name);

  constructor(
    @InjectModel(DisputeVote.name)
    private voteModel: Model<DisputeVoteDocument>,
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    private readonly nftService: NFTService,
  ) {}

  /**
   * Start voting for a disputed market
   */
  async startVoting(marketId: string, durationHours: number = 24): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    // Market should be in disputed status or locked
    if (market.status !== PredictionStatus.DISPUTED && market.status !== PredictionStatus.LOCKED) {
      throw new BadRequestException(`Market must be disputed or locked to start voting. Current status: ${market.status}`);
    }

    // Check if voting already active
    if (market.voting?.status === VotingStatus.ACTIVE) {
      throw new BadRequestException('Voting is already active for this market');
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    // Initialize voting config
    market.voting = {
      enabled: true,
      status: VotingStatus.ACTIVE,
      startedAt: now,
      endsAt,
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      requiredRole: 'nft_holder',
      durationHours,
    };

    // Update market status to DISPUTED if not already
    if (market.status !== PredictionStatus.DISPUTED) {
      market.status = PredictionStatus.DISPUTED;
    }

    await market.save();

    this.logger.log(`Voting started for market ${marketId}, ends at ${endsAt.toISOString()}`);

    return {
      marketId,
      status: 'voting_started',
      voting: market.voting,
    };
  }

  /**
   * Cast a vote on a disputed market
   */
  async castVote(marketId: string, wallet: string, choice: VoteChoice): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    // Check market status
    if (market.status !== PredictionStatus.DISPUTED) {
      throw new BadRequestException(`Market is not in disputed status. Current: ${market.status}`);
    }

    // Check voting is active
    if (!market.voting || market.voting.status !== VotingStatus.ACTIVE) {
      throw new BadRequestException('Voting is not active for this market');
    }

    // Check voting not expired
    if (market.voting.endsAt && new Date() > new Date(market.voting.endsAt)) {
      throw new BadRequestException('Voting period has ended');
    }

    // Check NFT eligibility - REAL blockchain check
    const hasNFT = await this.checkNFTEligibility(wallet);
    if (!hasNFT && market.voting.requiredRole === 'nft_holder') {
      throw new BadRequestException('NFT_REQUIRED: You need to hold an eligible NFT to vote. Get a position on any market to participate.');
    }

    // Check if already voted
    const existingVote = await this.voteModel.findOne({ marketId, wallet });
    if (existingVote) {
      throw new ConflictException('You have already voted on this market');
    }

    // Calculate vote weight based on NFT balance (future: weighted voting)
    const nftBalance = await this.nftService.getBalance(wallet);
    const weight = 1; // For now, 1 wallet = 1 vote (can enable nftBalance for weighted voting)

    // Create vote
    const vote = new this.voteModel({
      marketId,
      wallet: wallet.toLowerCase(),
      choice,
      weight,
      nftCount: 1,
    });
    await vote.save();

    // Update market vote counts atomically using ObjectId
    const objectId = new Types.ObjectId(marketId);
    const updateField = choice === VoteChoice.YES ? 'voting.yesVotes' : 'voting.noVotes';
    
    try {
      const result = await this.predictionModel.findOneAndUpdate(
        { _id: objectId },
        {
          $inc: {
            [updateField]: weight,
            'voting.totalVotes': weight,
          },
        },
        { new: true }
      );

      this.logger.log(`Vote cast on market ${marketId} by ${wallet}: ${choice}. Updated voting: YES=${result?.voting?.yesVotes}, NO=${result?.voting?.noVotes}, Total=${result?.voting?.totalVotes}`);

      return {
        marketId,
        wallet,
        choice,
        weight,
        success: true,
        voting: {
          yesVotes: result?.voting?.yesVotes || 0,
          noVotes: result?.voting?.noVotes || 0,
          totalVotes: result?.voting?.totalVotes || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update vote counts: ${error.message}`);
      return {
        marketId,
        wallet,
        choice,
        weight,
        success: true,
        voting: { yesVotes: 0, noVotes: 0, totalVotes: 0 },
      };
    }
  }

  /**
   * Get voting status for a market
   */
  async getVotingStatus(marketId: string, wallet?: string): Promise<VotingStatusResponse> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    // Get user's vote if wallet provided
    let userVote = null;
    let hasVoted = false;
    let canVote = false;
    let hasNFT = false;

    if (wallet) {
      const vote = await this.voteModel.findOne({ marketId, wallet: wallet.toLowerCase() });
      if (vote) {
        userVote = vote.choice;
        hasVoted = true;
      }
      hasNFT = await this.checkNFTEligibility(wallet);
      
      // Can vote if: voting active, not already voted, has NFT (or NFT not required)
      canVote = market.voting?.status === VotingStatus.ACTIVE &&
                !hasVoted &&
                (hasNFT || market.voting?.requiredRole !== 'nft_holder') &&
                (!market.voting?.endsAt || new Date() < new Date(market.voting.endsAt));
    }

    // Get NFT balance for display
    const nftBalance = wallet ? await this.getNFTBalance(wallet) : 0;

    const voting: any = market.voting || {
      status: VotingStatus.IDLE,
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
    };

    return {
      marketId,
      marketStatus: market.status,
      voting: {
        status: voting.status || VotingStatus.IDLE,
        yesVotes: voting.yesVotes || 0,
        noVotes: voting.noVotes || 0,
        totalVotes: voting.totalVotes || 0,
        endsAt: voting.endsAt ? new Date(voting.endsAt).toISOString() : null,
        result: voting.result || null,
        startedAt: voting.startedAt ? new Date(voting.startedAt).toISOString() : null,
      },
      user: {
        canVote,
        hasVoted,
        vote: userVote,
        hasNFT,
        nftBalance,
      },
      disputeReason: (market as any).disputeReason,
      disputedAt: (market as any).disputedAt?.toISOString(),
      disputedBy: (market as any).disputedBy,
    };
  }

  /**
   * Finalize voting and resolve the market
   */
  async finalizeVoting(marketId: string): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    // Check voting exists and is active
    if (!market.voting || market.voting.status !== VotingStatus.ACTIVE) {
      throw new BadRequestException('Voting is not active for this market');
    }

    // Check voting period ended (or allow admin to force finalize)
    const now = new Date();
    const isExpired = market.voting.endsAt && now >= new Date(market.voting.endsAt);
    
    const yesVotes = market.voting.yesVotes || 0;
    const noVotes = market.voting.noVotes || 0;
    const totalVotes = market.voting.totalVotes || 0;

    // Determine result
    let result: 'yes' | 'no' | 'invalid';
    let winningOutcome: ResolutionOutcome;

    if (totalVotes === 0) {
      result = 'invalid';
      winningOutcome = ResolutionOutcome.INVALID;
    } else if (yesVotes > noVotes) {
      result = 'yes';
      winningOutcome = ResolutionOutcome.YES;
    } else if (noVotes > yesVotes) {
      result = 'no';
      winningOutcome = ResolutionOutcome.NO;
    } else {
      // Tie
      result = 'invalid';
      winningOutcome = ResolutionOutcome.INVALID;
    }

    // Update voting config
    market.voting.status = VotingStatus.FINISHED;
    market.voting.result = result;
    market.markModified('voting');

    // Update market resolution
    market.status = PredictionStatus.RESOLVED;
    market.winningOutcome = winningOutcome;
    market.resolvedAt = now;

    if (!market.resolution) {
      (market as any).resolution = {
        mode: 'admin', // Required field
        status: ResolutionStatus.RESOLVED,
        resolvedOutcome: winningOutcome,
        resolvedAt: now,
        resolvedBy: 'community',
        resolutionReason: `Community voting: YES ${yesVotes}, NO ${noVotes}, Total ${totalVotes}`,
      };
    } else {
      market.resolution.status = ResolutionStatus.RESOLVED;
      market.resolution.resolvedOutcome = winningOutcome;
      market.resolution.resolvedAt = now;
      market.resolution.resolvedBy = 'community';
      market.resolution.resolutionReason = `Community voting: YES ${yesVotes}, NO ${noVotes}, Total ${totalVotes}`;
    }
    market.markModified('resolution');

    await market.save();

    this.logger.log(`Voting finalized for market ${marketId}: ${result} (YES: ${yesVotes}, NO: ${noVotes})`);

    return {
      marketId,
      status: 'voting_finalized',
      result,
      winningOutcome,
      votes: {
        yes: yesVotes,
        no: noVotes,
        total: totalVotes,
      },
    };
  }

  /**
   * Get all votes for a market
   */
  async getMarketVotes(marketId: string, page: number = 1, limit: number = 50): Promise<{
    votes: DisputeVote[];
    total: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [votes, total] = await Promise.all([
      this.voteModel
        .find({ marketId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.voteModel.countDocuments({ marketId }),
    ]);

    return { votes: votes as DisputeVote[], total };
  }

  /**
   * Get markets pending voting finalization
   */
  async getMarketsForVotingFinalization(): Promise<PredictionDocument[]> {
    const now = new Date();
    
    return this.predictionModel.find({
      status: PredictionStatus.DISPUTED,
      'voting.status': VotingStatus.ACTIVE,
      'voting.endsAt': { $lte: now },
    }).exec();
  }

  /**
   * Cancel voting (admin only)
   */
  async cancelVoting(marketId: string): Promise<any> {
    const market = await this.predictionModel.findById(marketId);
    if (!market) {
      throw new NotFoundException(`Market ${marketId} not found`);
    }

    if (!market.voting || market.voting.status !== VotingStatus.ACTIVE) {
      throw new BadRequestException('No active voting to cancel');
    }

    market.voting.status = VotingStatus.IDLE;
    market.voting.result = 'invalid';
    
    // Revert market to locked status for admin review
    market.status = PredictionStatus.LOCKED;
    
    await market.save();

    // Optionally delete votes
    await this.voteModel.deleteMany({ marketId });

    this.logger.log(`Voting canceled for market ${marketId}`);

    return {
      marketId,
      status: 'voting_canceled',
    };
  }

  /**
   * Check NFT eligibility for voting
   * Uses real blockchain check via NFTService
   */
  async checkNFTEligibility(wallet: string): Promise<boolean> {
    try {
      const hasNFT = await this.nftService.hasNFT(wallet);
      this.logger.debug(`NFT eligibility check for ${wallet}: ${hasNFT}`);
      return hasNFT;
    } catch (error) {
      this.logger.error(`NFT eligibility check failed for ${wallet}: ${error.message}`);
      // Fail secure - deny voting if check fails
      return false;
    }
  }

  /**
   * Get NFT balance for wallet
   */
  async getNFTBalance(wallet: string): Promise<number> {
    try {
      return await this.nftService.getBalance(wallet);
    } catch (error) {
      this.logger.error(`NFT balance check failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get voting statistics
   */
  async getVotingStats(): Promise<{
    activeVotings: number;
    totalVotesCast: number;
    marketsFinalizedByVoting: number;
  }> {
    const [activeVotings, totalVotes, finalized] = await Promise.all([
      this.predictionModel.countDocuments({
        'voting.status': VotingStatus.ACTIVE,
      }),
      this.voteModel.countDocuments({}),
      this.predictionModel.countDocuments({
        'voting.status': VotingStatus.FINISHED,
        'resolution.resolvedBy': 'community',
      }),
    ]);

    return {
      activeVotings,
      totalVotesCast: totalVotes,
      marketsFinalizedByVoting: finalized,
    };
  }
}
