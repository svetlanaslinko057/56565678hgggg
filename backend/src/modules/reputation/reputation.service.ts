import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { CreatorReputation, CreatorReputationDocument, ReputationTier } from './reputation.schema';
import { EVENTS } from '../../events/event-types';

export interface ReputationUpdate {
  wallet: string;
  action: 'market_approved' | 'market_rejected' | 'market_disputed' | 'volume_generated';
  amount?: number;
}

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  // Score weights
  private readonly SCORE_APPROVED = 5;
  private readonly SCORE_REJECTED = -3;
  private readonly SCORE_DISPUTED = -10;
  private readonly SCORE_BURNED_STAKE = -20;
  private readonly SCORE_VOLUME_MULTIPLIER = 0.001;

  // Tier thresholds
  private readonly TIER_THRESHOLDS = {
    [ReputationTier.NEWCOMER]: 0,
    [ReputationTier.TRUSTED]: 50,
    [ReputationTier.VERIFIED]: 200,
    [ReputationTier.ELITE]: 500,
  };

  // Stake requirements by tier
  private readonly STAKE_BY_TIER = {
    [ReputationTier.NEWCOMER]: 100,
    [ReputationTier.TRUSTED]: 75,
    [ReputationTier.VERIFIED]: 50,
    [ReputationTier.ELITE]: 10,
  };

  constructor(
    @InjectModel(CreatorReputation.name)
    private reputationModel: Model<CreatorReputationDocument>,
  ) {}

  /**
   * Get or create reputation for wallet
   */
  async getOrCreate(wallet: string): Promise<CreatorReputationDocument> {
    const normalizedWallet = wallet.toLowerCase();
    
    let reputation = await this.reputationModel.findOne({ wallet: normalizedWallet });
    
    if (!reputation) {
      reputation = new this.reputationModel({
        wallet: normalizedWallet,
        score: 0,
        tier: ReputationTier.NEWCOMER,
        requiredStake: this.STAKE_BY_TIER[ReputationTier.NEWCOMER],
      });
      await reputation.save();
    }
    
    return reputation;
  }

  /**
   * Get reputation by wallet
   */
  async getByWallet(wallet: string): Promise<CreatorReputation | null> {
    return this.reputationModel.findOne({ wallet: wallet.toLowerCase() });
  }

  /**
   * Get required stake for wallet based on reputation
   */
  async getRequiredStake(wallet: string): Promise<number> {
    const reputation = await this.getOrCreate(wallet);
    return reputation.requiredStake;
  }

  /**
   * Event: Market approved
   */
  @OnEvent(EVENTS.MARKET_APPROVED)
  async onMarketApproved(payload: { creator: string }) {
    await this.handleMarketApproved(payload.creator);
  }

  async handleMarketApproved(wallet: string) {
    const reputation = await this.getOrCreate(wallet);
    
    reputation.marketsApproved += 1;
    reputation.score += this.SCORE_APPROVED;
    
    await this.updateTier(reputation);
    await reputation.save();
    
    this.logger.log(`Reputation updated for ${wallet}: +${this.SCORE_APPROVED} (market approved)`);
  }

  /**
   * Event: Market rejected
   */
  @OnEvent(EVENTS.MARKET_REJECTED)
  async onMarketRejected(payload: { creator: string; stakeBurned?: boolean }) {
    await this.handleMarketRejected(payload.creator, payload.stakeBurned);
  }

  async handleMarketRejected(wallet: string, stakeBurned: boolean = false) {
    const reputation = await this.getOrCreate(wallet);
    
    reputation.marketsRejected += 1;
    reputation.score += this.SCORE_REJECTED;
    
    if (stakeBurned) {
      reputation.totalStakeBurned += reputation.requiredStake;
      reputation.score += this.SCORE_BURNED_STAKE;
    } else {
      reputation.totalStakeReturned += reputation.requiredStake;
    }
    
    // Ensure score doesn't go negative beyond threshold
    reputation.score = Math.max(reputation.score, -100);
    
    await this.updateTier(reputation);
    await reputation.save();
    
    this.logger.log(`Reputation updated for ${wallet}: ${this.SCORE_REJECTED} (market rejected, burned=${stakeBurned})`);
  }

  /**
   * Handle market disputed
   */
  async handleMarketDisputed(wallet: string) {
    const reputation = await this.getOrCreate(wallet);
    
    reputation.marketsDisputed += 1;
    reputation.score += this.SCORE_DISPUTED;
    reputation.score = Math.max(reputation.score, -100);
    
    await this.updateTier(reputation);
    await reputation.save();
    
    this.logger.log(`Reputation updated for ${wallet}: ${this.SCORE_DISPUTED} (market disputed)`);
  }

  /**
   * Handle volume generated
   */
  async handleVolumeGenerated(wallet: string, volume: number) {
    const reputation = await this.getOrCreate(wallet);
    
    reputation.totalVolume += volume;
    reputation.score += Math.floor(volume * this.SCORE_VOLUME_MULTIPLIER);
    
    if (reputation.marketsApproved > 0) {
      reputation.avgMarketVolume = reputation.totalVolume / reputation.marketsApproved;
    }
    
    await this.updateTier(reputation);
    await reputation.save();
    
    this.logger.log(`Volume credited for ${wallet}: +${volume}, new total: ${reputation.totalVolume}`);
  }

  /**
   * Update tier based on score
   */
  private async updateTier(reputation: CreatorReputationDocument) {
    let newTier = ReputationTier.NEWCOMER;
    
    if (reputation.score >= this.TIER_THRESHOLDS[ReputationTier.ELITE]) {
      newTier = ReputationTier.ELITE;
    } else if (reputation.score >= this.TIER_THRESHOLDS[ReputationTier.VERIFIED]) {
      newTier = ReputationTier.VERIFIED;
    } else if (reputation.score >= this.TIER_THRESHOLDS[ReputationTier.TRUSTED]) {
      newTier = ReputationTier.TRUSTED;
    }
    
    if (newTier !== reputation.tier) {
      this.logger.log(`Tier changed for ${reputation.wallet}: ${reputation.tier} -> ${newTier}`);
    }
    
    reputation.tier = newTier;
    reputation.requiredStake = this.STAKE_BY_TIER[newTier];
    
    // Set perks
    reputation.fastApproval = [ReputationTier.VERIFIED, ReputationTier.ELITE].includes(newTier);
    reputation.priorityListing = newTier === ReputationTier.ELITE;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 20): Promise<CreatorReputation[]> {
    return this.reputationModel
      .find({ marketsApproved: { $gt: 0 } })
      .sort({ score: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get stats summary
   */
  async getStats(): Promise<{
    totalCreators: number;
    byTier: Record<string, number>;
    avgScore: number;
  }> {
    const stats = await this.reputationModel.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    const totalCreators = await this.reputationModel.countDocuments();
    const byTier: Record<string, number> = {};
    let totalScore = 0;

    for (const stat of stats) {
      byTier[stat._id] = stat.count;
      totalScore += stat.avgScore * stat.count;
    }

    return {
      totalCreators,
      byTier,
      avgScore: totalCreators > 0 ? totalScore / totalCreators : 0,
    };
  }
}
