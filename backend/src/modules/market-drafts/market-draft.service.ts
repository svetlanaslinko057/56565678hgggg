import { 
  Injectable, 
  Logger, 
  BadRequestException, 
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { 
  MarketDraft, 
  MarketDraftDocument, 
  DraftStatus,
  StakeStatus,
  ResolutionType,
} from './market-draft.schema';
import { 
  MarketVote, 
  MarketVoteDocument, 
  VoteStatus 
} from './market-vote.schema';
import { CreateMarketDraftDto, CastVoteDto, CreateDisputeDto } from './market-draft.dto';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';
import { PredictionsService } from '../predictions/predictions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { EVENTS } from '../../events/event-types';

@Injectable()
export class MarketDraftService {
  private readonly logger = new Logger(MarketDraftService.name);
  private readonly CREATION_STAKE: number;

  constructor(
    @InjectModel(MarketDraft.name)
    private draftModel: Model<MarketDraftDocument>,
    @InjectModel(MarketVote.name)
    private voteModel: Model<MarketVoteDocument>,
    private configService: ConfigService,
    private ledgerService: LedgerService,
    private predictionsService: PredictionsService,
    private notificationsService: NotificationsService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
  ) {
    this.CREATION_STAKE = this.configService.get<number>('MARKET_CREATION_STAKE') || 100;
  }

  /**
   * Get platform config for market creation
   */
  getConfig() {
    return {
      creationStake: this.CREATION_STAKE,
      minVotesForDispute: 10,
      disputeDurationHours: 24,
      maxMarketsPerUser: 10,
    };
  }

  /**
   * Create market draft with stake lock
   */
  async createDraft(dto: CreateMarketDraftDto, creatorWallet: string): Promise<MarketDraft> {
    // Check user limits
    const userDrafts = await this.draftModel.countDocuments({
      creatorWallet,
      status: { $in: [DraftStatus.DRAFT, DraftStatus.REVIEW] },
    });

    if (userDrafts >= 10) {
      throw new BadRequestException('Maximum 10 pending drafts allowed per user');
    }

    // For testnet (BSC Testnet chain ID 97), skip stake requirement
    const isTestnet = process.env.CHAIN_ID === '97' || !process.env.CHAIN_ID;
    let stakeLedgerRef = null;
    
    if (!isTestnet) {
      // Lock stake on mainnet
      const stakeLedgerEntry = await this.ledgerService.deductBalance(
        creatorWallet,
        this.CREATION_STAKE,
        LedgerType.STAKE_LOCK,
        `market_draft_${Date.now()}`,
        `Market creation stake locked: ${dto.title}`,
      );
      stakeLedgerRef = (stakeLedgerEntry as any)._id.toString();
    } else {
      this.logger.log(`Testnet mode: Skipping stake lock for ${creatorWallet}`);
    }

    // Create draft
    const draft = new this.draftModel({
      ...dto,
      creatorWallet,
      closeTime: new Date(dto.closeTime),
      stakeAmount: isTestnet ? 0 : this.CREATION_STAKE,
      stakeStatus: isTestnet ? StakeStatus.RETURNED : StakeStatus.LOCKED,
      stakeLedgerRef,
      status: DraftStatus.DRAFT,
    });

    await draft.save();

    this.logger.log(`Draft created: ${(draft as any)._id} by ${creatorWallet}, stake: ${isTestnet ? 'skipped (testnet)' : this.CREATION_STAKE}`);

    return draft;
  }

  /**
   * Get drafts by creator
   */
  async getMyDrafts(wallet: string): Promise<MarketDraft[]> {
    return this.draftModel
      .find({ creatorWallet: wallet })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get draft by ID
   */
  async getDraftById(id: string): Promise<MarketDraftDocument> {
    const draft = await this.draftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }
    return draft;
  }

  /**
   * Update draft (only if status = draft)
   */
  async updateDraft(id: string, dto: Partial<CreateMarketDraftDto>, wallet: string): Promise<MarketDraft> {
    const draft = await this.getDraftById(id);

    if (draft.creatorWallet !== wallet) {
      throw new ForbiddenException('Not the draft owner');
    }

    if (draft.status !== DraftStatus.DRAFT) {
      throw new BadRequestException('Can only update drafts in draft status');
    }

    Object.assign(draft, {
      ...dto,
      closeTime: dto.closeTime ? new Date(dto.closeTime) : draft.closeTime,
    });

    await draft.save();
    return draft;
  }

  /**
   * Submit draft for review
   */
  async submitForReview(id: string, wallet: string): Promise<MarketDraft> {
    const draft = await this.getDraftById(id);

    if (draft.creatorWallet !== wallet) {
      throw new ForbiddenException('Not the draft owner');
    }

    if (draft.status !== DraftStatus.DRAFT) {
      throw new BadRequestException('Can only submit drafts in draft status');
    }

    // Validate draft
    if (!draft.title || draft.outcomes.length < 2) {
      throw new BadRequestException('Draft must have title and at least 2 outcomes');
    }

    if (new Date(draft.closeTime) <= new Date()) {
      throw new BadRequestException('Close time must be in the future');
    }

    draft.status = DraftStatus.REVIEW;
    await draft.save();

    // Emit event for admin notification
    this.eventEmitter.emit(EVENTS.MARKET_SUBMITTED, {
      draftId: (draft as any)._id.toString(),
      title: draft.title,
      creator: draft.creatorWallet,
    });

    // Create notification for user
    await this.notificationsService.create({
      userWallet: draft.creatorWallet,
      type: 'market_submitted' as any,
      title: 'Market Submitted for Review',
      message: `Your market "${draft.title}" is now under review.`,
      payload: { draftId: (draft as any)._id.toString() },
    });

    this.logger.log(`Draft submitted for review: ${id}`);

    return draft;
  }

  /**
   * Admin: Get pending drafts
   */
  async getPendingDrafts(): Promise<MarketDraft[]> {
    return this.draftModel
      .find({ status: DraftStatus.REVIEW })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Admin: Approve draft → Create market → Return stake
   */
  async approveDraft(id: string, adminWallet: string): Promise<{ draft: MarketDraft; marketId: string }> {
    const draft = await this.getDraftById(id);

    if (draft.status !== DraftStatus.REVIEW) {
      throw new BadRequestException('Can only approve drafts in review status');
    }

    // Create actual market/prediction
    const market = await this.predictionsService.create(
      {
        question: draft.title,
        description: draft.description || '',
        type: draft.type as any,
        outcomes: draft.outcomes,
        category: draft.category,
        closeTime: draft.closeTime.toISOString(),
        logo: draft.logo,
        resolutionSource: draft.resolutionSource,
      },
      draft.creatorWallet,
    );

    // Publish the market
    await this.predictionsService.submitForReview((market as any)._id.toString());
    await this.predictionsService.publish((market as any)._id.toString(), false);

    // Return stake to creator
    await this.ledgerService.creditBalance(
      draft.creatorWallet,
      draft.stakeAmount,
      LedgerType.STAKE_RETURN,
      (draft as any)._id.toString(),
      `Market approved - stake returned: ${draft.title}`,
    );

    // Update draft
    draft.status = DraftStatus.APPROVED;
    draft.stakeStatus = StakeStatus.RETURNED;
    draft.reviewedBy = adminWallet;
    draft.reviewedAt = new Date();
    draft.publishedMarketId = (market as any)._id.toString();
    await draft.save();

    // Notify creator
    await this.notificationsService.create({
      userWallet: draft.creatorWallet,
      type: 'market_approved' as any,
      title: 'Market Approved!',
      message: `Your market "${draft.title}" has been approved and is now live!`,
      payload: {
        draftId: (draft as any)._id.toString(),
        marketId: (market as any)._id.toString(),
      },
    });

    this.eventEmitter.emit(EVENTS.MARKET_CREATED, {
      marketId: (market as any)._id.toString(),
      title: draft.title,
      creator: draft.creatorWallet,
    });

    this.logger.log(`Draft approved: ${id} → Market: ${(market as any)._id}`);

    return {
      draft,
      marketId: (market as any)._id.toString(),
    };
  }

  /**
   * Admin: Reject draft → Burn/Return stake
   */
  async rejectDraft(
    id: string,
    adminWallet: string,
    reason: string,
    burnStake: boolean = false,
  ): Promise<MarketDraft> {
    const draft = await this.getDraftById(id);

    if (draft.status !== DraftStatus.REVIEW) {
      throw new BadRequestException('Can only reject drafts in review status');
    }

    // Handle stake
    if (burnStake) {
      draft.stakeStatus = StakeStatus.BURNED;
      this.logger.log(`Stake burned for draft: ${id}, amount: ${draft.stakeAmount}`);
    } else {
      // Return stake
      await this.ledgerService.creditBalance(
        draft.creatorWallet,
        draft.stakeAmount,
        LedgerType.STAKE_RETURN,
        (draft as any)._id.toString(),
        `Market rejected - stake returned: ${draft.title}`,
      );
      draft.stakeStatus = StakeStatus.RETURNED;
    }

    // Update draft
    draft.status = DraftStatus.REJECTED;
    draft.reviewedBy = adminWallet;
    draft.reviewedAt = new Date();
    draft.rejectionReason = reason;
    await draft.save();

    // Notify creator
    await this.notificationsService.create({
      userWallet: draft.creatorWallet,
      type: 'market_rejected' as any,
      title: 'Market Rejected',
      message: `Your market "${draft.title}" was rejected. Reason: ${reason}`,
      payload: {
        draftId: (draft as any)._id.toString(),
        reason,
        stakeReturned: !burnStake,
      },
    });

    this.logger.log(`Draft rejected: ${id}, reason: ${reason}, stake burned: ${burnStake}`);

    return draft;
  }

  /**
   * Cancel draft → Return stake
   */
  async cancelDraft(id: string, wallet: string): Promise<MarketDraft> {
    const draft = await this.getDraftById(id);

    if (draft.creatorWallet !== wallet) {
      throw new ForbiddenException('Not the draft owner');
    }

    if (draft.status !== DraftStatus.DRAFT) {
      throw new BadRequestException('Can only cancel drafts in draft status');
    }

    // Return stake
    await this.ledgerService.creditBalance(
      draft.creatorWallet,
      draft.stakeAmount,
      LedgerType.STAKE_RETURN,
      (draft as any)._id.toString(),
      `Draft canceled - stake returned: ${draft.title}`,
    );

    // Delete draft
    await this.draftModel.findByIdAndDelete(id);

    this.logger.log(`Draft canceled: ${id}, stake returned: ${draft.stakeAmount}`);

    return draft;
  }

  // ==================== Community Voting ====================

  /**
   * Create dispute / vote session
   */
  async createDispute(
    marketId: string,
    dto: CreateDisputeDto,
    creatorWallet: string,
  ): Promise<MarketVote> {
    // Check if vote already exists
    const existingVote = await this.voteModel.findOne({
      marketId,
      status: VoteStatus.ACTIVE,
    });

    if (existingVote) {
      throw new BadRequestException('Active vote session already exists for this market');
    }

    const durationHours = dto.durationHours || 24;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    // Get eligible voters (NFT holders snapshot)
    // For now, just create empty - can be populated with actual NFT holders
    const eligibleVoters: string[] = [];

    const vote = new this.voteModel({
      marketId,
      proposedOutcome: dto.proposedOutcome,
      disputeReason: dto.reason,
      status: VoteStatus.ACTIVE,
      startTime,
      endTime,
      eligibleVoters,
      minVotesRequired: 10,
    });

    await vote.save();

    // Emit event
    this.eventEmitter.emit(EVENTS.VOTE_STARTED, {
      voteId: (vote as any)._id.toString(),
      marketId,
      proposedOutcome: dto.proposedOutcome,
      endTime,
    });

    this.logger.log(`Dispute created for market ${marketId}, ends at ${endTime}`);

    return vote;
  }

  /**
   * Cast vote
   */
  async castVote(
    voteId: string,
    wallet: string,
    dto: CastVoteDto,
  ): Promise<MarketVote> {
    const vote = await this.voteModel.findById(voteId);
    if (!vote) {
      throw new NotFoundException('Vote session not found');
    }

    if (vote.status !== VoteStatus.ACTIVE) {
      throw new BadRequestException('Vote session is not active');
    }

    if (new Date() > vote.endTime) {
      throw new BadRequestException('Vote session has ended');
    }

    // Check if already voted
    const alreadyVoted = vote.votes.some(v => v.wallet.toLowerCase() === wallet.toLowerCase());
    if (alreadyVoted) {
      throw new BadRequestException('Already voted');
    }

    // Validate NFT ownership if required
    if (vote.eligibleVoters.length > 0) {
      const isEligible = vote.eligibleVoters.some(w => w.toLowerCase() === wallet.toLowerCase());
      if (!isEligible) {
        // Check NFT ownership
        const { nfts } = await this.walletService.getNFTs(wallet);
        if (nfts.length === 0) {
          throw new ForbiddenException('Must hold NFT to vote');
        }
      }
    }

    // Record vote
    vote.votes.push({
      wallet: wallet.toLowerCase(),
      vote: dto.vote,
      nftTokenId: dto.nftTokenId,
      timestamp: new Date(),
    });

    // Update counts
    if (dto.vote === vote.proposedOutcome) {
      vote.votesFor += 1;
    } else {
      vote.votesAgainst += 1;
    }

    await vote.save();

    this.logger.log(`Vote cast: ${wallet} voted ${dto.vote} on ${voteId}`);

    return vote;
  }

  /**
   * Get active votes
   */
  async getActiveVotes(): Promise<MarketVote[]> {
    return this.voteModel
      .find({ status: VoteStatus.ACTIVE })
      .sort({ endTime: 1 })
      .exec();
  }

  /**
   * Get vote by market
   */
  async getVoteByMarket(marketId: string): Promise<MarketVote | null> {
    return this.voteModel.findOne({ marketId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Finalize vote (called after endTime or by admin)
   */
  async finalizeVote(voteId: string, adminWallet?: string): Promise<MarketVote> {
    const vote = await this.voteModel.findById(voteId);
    if (!vote) {
      throw new NotFoundException('Vote session not found');
    }

    if (vote.status !== VoteStatus.ACTIVE) {
      throw new BadRequestException('Vote already finalized');
    }

    const totalVotes = vote.votesFor + vote.votesAgainst;

    // Check minimum votes
    if (totalVotes < vote.minVotesRequired) {
      // Not enough votes - return to admin decision
      vote.status = VoteStatus.CANCELED;
      vote.resolvedAt = new Date();
      vote.resolvedBy = adminWallet || 'system';
      await vote.save();

      this.logger.log(`Vote ${voteId} canceled - not enough votes (${totalVotes}/${vote.minVotesRequired})`);
      return vote;
    }

    // Determine winner
    const winningOutcome = vote.votesFor >= vote.votesAgainst 
      ? vote.proposedOutcome 
      : 'rejected';

    vote.status = VoteStatus.COMPLETED;
    vote.finalOutcome = winningOutcome;
    vote.resolvedAt = new Date();
    vote.resolvedBy = adminWallet || 'community';
    await vote.save();

    // Emit event
    this.eventEmitter.emit(EVENTS.VOTE_ENDED, {
      voteId: (vote as any)._id.toString(),
      marketId: vote.marketId,
      finalOutcome: winningOutcome,
      votesFor: vote.votesFor,
      votesAgainst: vote.votesAgainst,
    });

    this.logger.log(`Vote ${voteId} finalized: ${winningOutcome} (${vote.votesFor} for, ${vote.votesAgainst} against)`);

    return vote;
  }
}
