import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prediction, PredictionDocument, PredictionStatus } from './predictions.schema';
import { CreatePredictionDto, UpdatePredictionDto } from './predictions.dto';
import { Web3Service } from '../../infra/web3/web3.service';

export interface PredictionFilters {
  status?: PredictionStatus;
  category?: string;
  riskLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
    private web3Service: Web3Service,
  ) {}

  async create(dto: CreatePredictionDto, userId: string): Promise<Prediction> {
    const prediction = new this.predictionModel({
      ...dto,
      createdBy: userId,
      status: PredictionStatus.DRAFT,
      closeTime: new Date(dto.closeTime),
      resolveTime: dto.resolveTime ? new Date(dto.resolveTime) : null,
    });
    return prediction.save();
  }

  async findAll(
    filters: PredictionFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Prediction[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.riskLevel) {
      query.riskLevel = filters.riskLevel;
    }

    if (filters.search) {
      query.$or = [
        { question: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.predictionModel
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.predictionModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<PredictionDocument> {
    const prediction = await this.predictionModel.findById(id).exec();
    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }
    return prediction;
  }

  async update(id: string, dto: UpdatePredictionDto): Promise<Prediction> {
    const prediction = await this.findById(id);

    if (prediction.status !== PredictionStatus.DRAFT) {
      throw new BadRequestException('Can only update draft predictions');
    }

    const updated = await this.predictionModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          closeTime: dto.closeTime ? new Date(dto.closeTime) : undefined,
        },
        { new: true },
      )
      .exec();

    return updated;
  }

  async submitForReview(id: string): Promise<Prediction> {
    const prediction = await this.findById(id);

    if (prediction.status !== PredictionStatus.DRAFT) {
      throw new BadRequestException('Can only submit draft predictions for review');
    }

    prediction.status = PredictionStatus.REVIEW;
    return prediction.save();
  }

  /**
   * Publish prediction → Create market on-chain → Save marketId
   * 
   * Flow:
   * 1. Find prediction in REVIEW status
   * 2. Call smart contract createMarket()
   * 3. Get marketId from event
   * 4. Save marketId to prediction
   * 5. Set status = PUBLISHED
   */
  async publish(id: string, useOnChain: boolean = true): Promise<Prediction> {
    const prediction = await this.findById(id);

    if (prediction.status !== PredictionStatus.REVIEW) {
      throw new BadRequestException('Can only publish predictions in review');
    }

    const chainId = this.web3Service.getChainId();
    const contractAddress = this.web3Service.getContractAddress();

    // If contract is configured and useOnChain = true, create market on-chain
    if (useOnChain && contractAddress) {
      try {
        this.logger.log(`Publishing prediction ${id} to blockchain...`);

        // Prepare outcomes array from prediction
        const outcomeLabels = prediction.outcomes?.map(o => o.label) || ['Yes', 'No'];
        
        // Convert closeTime to Unix timestamp
        const closeTimeUnix = Math.floor(new Date(prediction.closeTime).getTime() / 1000);

        // Call smart contract with new signature
        const { marketId, txHash } = await this.web3Service.createMarketOnChain(
          (prediction as any)._id.toString(), // externalMarketId
          closeTimeUnix,
          outcomeLabels.length // outcomeCount
        );

        this.logger.log(`Market created on-chain: marketId=${marketId}, tx=${txHash}`);

        // Save chain data to prediction
        prediction.chain = {
          marketId,
          chainId,
          contractAddress,
        };

      } catch (error) {
        this.logger.error(`Failed to create market on-chain: ${error.message}`);
        throw new BadRequestException(`Failed to publish to blockchain: ${error.message}`);
      }
    } else if (!contractAddress) {
      this.logger.warn('No contract configured, publishing without on-chain market');
    }

    // Update status
    prediction.status = PredictionStatus.PUBLISHED;

    return prediction.save();
  }

  /**
   * Lock market on-chain and in DB
   */
  async lock(id: string): Promise<Prediction> {
    const prediction = await this.findById(id);

    if (prediction.status !== PredictionStatus.PUBLISHED) {
      throw new BadRequestException('Can only lock published predictions');
    }

    // Lock on-chain if configured
    if (prediction.chain?.marketId && this.web3Service.getContractAddress()) {
      try {
        const txHash = await this.web3Service.lockMarketOnChain(
          parseInt(prediction.chain.marketId)
        );
        this.logger.log(`Market ${prediction.chain.marketId} locked on-chain: ${txHash}`);
      } catch (error) {
        this.logger.error(`Failed to lock market on-chain: ${error.message}`);
        throw new BadRequestException(`Failed to lock on blockchain: ${error.message}`);
      }
    }

    prediction.status = PredictionStatus.LOCKED;
    return prediction.save();
  }

  /**
   * Resolve market with winning outcome
   */
  async resolve(id: string, winningOutcome: string): Promise<Prediction> {
    const prediction = await this.findById(id);

    if (prediction.status !== PredictionStatus.LOCKED) {
      throw new BadRequestException('Can only resolve locked predictions');
    }

    // Find outcome index
    const outcomeIndex = prediction.outcomes?.findIndex(o => 
      o.id === winningOutcome || o.label === winningOutcome
    ) ?? -1;

    // Resolve on-chain if configured
    if (prediction.chain?.marketId && this.web3Service.getContractAddress() && outcomeIndex >= 0) {
      try {
        const txHash = await this.web3Service.resolveMarketOnChain(
          parseInt(prediction.chain.marketId),
          outcomeIndex
        );
        this.logger.log(`Market ${prediction.chain.marketId} resolved on-chain: ${txHash}`);
      } catch (error) {
        this.logger.error(`Failed to resolve market on-chain: ${error.message}`);
        throw new BadRequestException(`Failed to resolve on blockchain: ${error.message}`);
      }
    }

    prediction.status = PredictionStatus.RESOLVED;
    prediction.winningOutcome = winningOutcome;
    prediction.resolvedAt = new Date();
    return prediction.save();
  }

  async cancel(id: string): Promise<Prediction> {
    const prediction = await this.findById(id);

    if ([PredictionStatus.RESOLVED, PredictionStatus.CANCELED].includes(prediction.status)) {
      throw new BadRequestException('Cannot cancel resolved or already canceled predictions');
    }

    prediction.status = PredictionStatus.CANCELED;
    return prediction.save();
  }

  async updateStats(id: string, volume: number, bets: number): Promise<void> {
    await this.predictionModel.findByIdAndUpdate(id, {
      $inc: { totalVolume: volume, totalBets: bets },
    });
  }

  async findByMarketId(marketId: string): Promise<Prediction | null> {
    return this.predictionModel.findOne({ 'chain.marketId': marketId }).exec();
  }

  // ==================== Dispute & Voting ====================

  async initiateDispute(id: string, wallet: string, reason: string): Promise<Prediction> {
    const prediction = await this.findById(id);
    if (!prediction) {
      throw new NotFoundException(`Prediction ${id} not found`);
    }

    if (prediction.status !== PredictionStatus.RESOLVED) {
      throw new BadRequestException('Only resolved markets can be disputed');
    }

    prediction.status = PredictionStatus.DISPUTED;
    (prediction as any).dispute = {
      initiatedBy: wallet,
      reason,
      initiatedAt: new Date(),
      votes: [],
      votingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    };

    await prediction.save();
    this.logger.log(`Market ${id} disputed by ${wallet}: ${reason}`);
    return prediction;
  }

  async submitVote(id: string, wallet: string, outcomeId: string, votePower: number = 1): Promise<any> {
    const prediction = await this.findById(id);
    if (!prediction) {
      throw new NotFoundException(`Prediction ${id} not found`);
    }

    if (prediction.status !== PredictionStatus.DISPUTED) {
      throw new BadRequestException('Market is not in disputed state');
    }

    const dispute = (prediction as any).dispute;
    if (!dispute) {
      throw new BadRequestException('No dispute found');
    }

    // Check if voting deadline passed
    if (new Date() > new Date(dispute.votingDeadline)) {
      throw new BadRequestException('Voting deadline has passed');
    }

    // Check if user already voted
    const existingVote = dispute.votes.find((v: any) => v.wallet === wallet.toLowerCase());
    if (existingVote) {
      throw new BadRequestException('User has already voted');
    }

    // Add vote
    dispute.votes.push({
      wallet: wallet.toLowerCase(),
      outcomeId,
      votePower,
      votedAt: new Date(),
    });

    await prediction.save();
    this.logger.log(`Vote submitted for market ${id} by ${wallet}: ${outcomeId}`);

    return {
      market: prediction,
      voteCount: dispute.votes.length,
    };
  }

  async getVotingStatus(id: string): Promise<any> {
    const prediction = await this.findById(id);
    if (!prediction) {
      throw new NotFoundException(`Prediction ${id} not found`);
    }

    const dispute = (prediction as any).dispute;
    if (!dispute) {
      return { hasDispute: false };
    }

    // Calculate votes per outcome
    const voteCounts: Record<string, number> = {};
    for (const vote of dispute.votes) {
      voteCounts[vote.outcomeId] = (voteCounts[vote.outcomeId] || 0) + vote.votePower;
    }

    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
    const votePercentages: Record<string, number> = {};
    for (const [outcomeId, count] of Object.entries(voteCounts)) {
      votePercentages[outcomeId] = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
    }

    return {
      hasDispute: true,
      marketId: id,
      originalOutcome: prediction.winningOutcome,
      disputeReason: dispute.reason,
      initiatedBy: dispute.initiatedBy,
      initiatedAt: dispute.initiatedAt,
      votingDeadline: dispute.votingDeadline,
      isVotingOpen: new Date() < new Date(dispute.votingDeadline),
      totalVotes,
      voteCounts,
      votePercentages,
      outcomes: prediction.outcomes,
    };
  }

  async finalizeVoting(id: string): Promise<any> {
    const prediction = await this.findById(id);
    if (!prediction) {
      throw new NotFoundException(`Prediction ${id} not found`);
    }

    if (prediction.status !== PredictionStatus.DISPUTED) {
      throw new BadRequestException('Market is not in disputed state');
    }

    const dispute = (prediction as any).dispute;
    if (!dispute) {
      throw new BadRequestException('No dispute found');
    }

    // Calculate winning outcome from votes
    const voteCounts: Record<string, number> = {};
    for (const vote of dispute.votes) {
      voteCounts[vote.outcomeId] = (voteCounts[vote.outcomeId] || 0) + vote.votePower;
    }

    let winningOutcome = prediction.winningOutcome; // Default to original
    let maxVotes = 0;
    for (const [outcomeId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningOutcome = outcomeId;
      }
    }

    // Update market
    prediction.winningOutcome = winningOutcome;
    prediction.status = PredictionStatus.RESOLVED;
    dispute.finalizedAt = new Date();
    dispute.finalOutcome = winningOutcome;

    await prediction.save();
    this.logger.log(`Market ${id} dispute finalized. Winner: ${winningOutcome}`);

    return {
      market: prediction,
      originalOutcome: prediction.winningOutcome,
      finalOutcome: winningOutcome,
      totalVotes: maxVotes,
      voteCounts,
    };
  }
}
