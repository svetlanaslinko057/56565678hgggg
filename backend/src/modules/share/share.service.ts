import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as crypto from 'crypto';
import { ShareLink, ShareLinkDocument } from './share.schema';
import { Position, PositionDocument } from '../positions/positions.schema';
import { Prediction, PredictionDocument } from '../predictions/predictions.schema';
import { Analyst, AnalystDocument } from '../analysts/analysts.schema';
import { CreateShareLinkDto, TrackReferralDto } from './share.dto';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);
  private readonly hmacSecret = process.env.SHARE_HMAC_SECRET || 'arena-share-secret-key-2026';

  // Referral XP bonus
  private readonly REFERRER_XP_BONUS = 25;
  private readonly REFERRER_LP_BONUS = 10;
  private readonly MIN_STAKE_FOR_REFERRAL = 10; // USDT

  constructor(
    @InjectModel(ShareLink.name) private shareLinkModel: Model<ShareLinkDocument>,
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(Analyst.name) private analystModel: Model<AnalystDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Generate HMAC signature for verification
   */
  private generateHmac(data: string): string {
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `sh_${timestamp}${random}`;
  }

  /**
   * Create shareable link for a position
   */
  async createShareLink(wallet: string, dto: CreateShareLinkDto): Promise<any> {
    // Find the position
    const position = await this.positionModel.findById(dto.positionId).lean().exec();
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Verify ownership
    if (position.wallet !== wallet) {
      throw new BadRequestException('You can only share your own positions');
    }

    // Check if share link already exists for this position
    const existingLink = await this.shareLinkModel.findOne({ 
      positionId: dto.positionId,
      createdByWallet: wallet,
    }).lean().exec();

    if (existingLink) {
      return {
        shareId: existingLink.shareId,
        url: this.buildShareUrl(existingLink.shareId),
        existing: true,
      };
    }

    // Generate share ID and HMAC
    const shareId = this.generateShareId();
    const hmacData = `${dto.positionId}:${wallet}:${position.marketId}`;
    const hmacSignature = this.generateHmac(hmacData);

    // Create share link
    const shareLink = new this.shareLinkModel({
      shareId,
      positionId: dto.positionId,
      marketId: position.marketId,
      createdByWallet: wallet,
      refWallet: wallet, // The creator becomes the referrer
      hmacSignature,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await shareLink.save();

    this.logger.log(`Share link created: ${shareId} by ${wallet}`);

    return {
      shareId,
      url: this.buildShareUrl(shareId),
      existing: false,
    };
  }

  /**
   * Get share link data for landing page
   */
  async getShareData(shareId: string): Promise<any> {
    const shareLink = await this.shareLinkModel.findOne({ shareId }).lean().exec();
    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    // Increment click count
    await this.shareLinkModel.updateOne(
      { shareId },
      { $inc: { clickCount: 1 } }
    );

    // Get position data
    const position = await this.positionModel.findById(shareLink.positionId).lean().exec();
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Get market data
    const market = await this.predictionModel.findById(shareLink.marketId).lean().exec();
    
    // Get creator profile
    const creator = await this.analystModel.findOne({ 
      wallet: shareLink.createdByWallet 
    }).lean().exec();

    // Verify HMAC
    const hmacData = `${shareLink.positionId}:${shareLink.createdByWallet}:${shareLink.marketId}`;
    const expectedHmac = this.generateHmac(hmacData);
    const verified = shareLink.hmacSignature === expectedHmac;

    // Determine status
    let status = 'open';
    let payout = 0;
    let roi = 0;

    if (position.status === 'won') {
      status = 'won';
      payout = position.potentialReturn || position.stake * (position.odds || 2);
      roi = ((payout - position.stake) / position.stake) * 100;
    } else if (position.status === 'lost') {
      status = 'lost';
      payout = 0;
      roi = -100;
    }

    return {
      shareId,
      marketTitle: market?.question || 'Market',
      marketCategory: market?.category || 'general',
      outcomeLabel: position.outcomeLabel || position.outcomeId,
      stake: position.stake,
      odds: position.odds || 2,
      status,
      payout,
      roi: roi.toFixed(1),
      verified,
      ref: shareLink.createdByWallet,
      creatorName: creator?.username || `${shareLink.createdByWallet.slice(0, 6)}...${shareLink.createdByWallet.slice(-4)}`,
      creatorAvatar: creator?.avatar || '/images/default-avatar.png',
      createdAt: shareLink.createdAt,
      clickCount: (shareLink.clickCount || 0) + 1,
    };
  }

  /**
   * Track referral conversion when new user makes first bet
   */
  async trackReferralConversion(dto: TrackReferralDto): Promise<any> {
    const shareLink = await this.shareLinkModel.findOne({ shareId: dto.shareId }).exec();
    if (!shareLink) {
      return { success: false, reason: 'Share link not found' };
    }

    // Check if user already converted
    const existingAnalyst = await this.analystModel.findOne({ wallet: dto.newUserWallet }).exec();
    if (existingAnalyst && existingAnalyst.referredBy) {
      return { success: false, reason: 'User already referred' };
    }

    // Check if referrer is trying to refer themselves
    if (shareLink.createdByWallet === dto.newUserWallet) {
      return { success: false, reason: 'Cannot refer yourself' };
    }

    // Update share link conversion count
    await this.shareLinkModel.updateOne(
      { shareId: dto.shareId },
      { $inc: { conversionCount: 1 } }
    );

    // Update or create new user with referral info
    if (existingAnalyst) {
      existingAnalyst.referredBy = shareLink.createdByWallet;
      await existingAnalyst.save();
    }

    this.logger.log(`Referral conversion tracked: ${dto.newUserWallet} referred by ${shareLink.createdByWallet}`);

    return { 
      success: true, 
      referrer: shareLink.createdByWallet,
    };
  }

  /**
   * Award referral bonus when referred user makes qualifying bet
   */
  async awardReferralBonus(newUserWallet: string, stakeAmount: number): Promise<any> {
    // Check minimum stake requirement
    if (stakeAmount < this.MIN_STAKE_FOR_REFERRAL) {
      return { success: false, reason: 'Stake below minimum for referral bonus' };
    }

    // Find the referrer
    const newUser = await this.analystModel.findOne({ wallet: newUserWallet }).exec();
    if (!newUser || !newUser.referredBy) {
      return { success: false, reason: 'No referrer found' };
    }

    // Check if bonus already awarded
    if ((newUser as any).referralBonusAwarded) {
      return { success: false, reason: 'Bonus already awarded' };
    }

    const referrerWallet = newUser.referredBy;

    // Award XP to referrer
    const referrer = await this.analystModel.findOne({ wallet: referrerWallet }).exec();
    if (referrer) {
      referrer.xp = (referrer.xp || 0) + this.REFERRER_XP_BONUS;
      referrer.leaguePoints = (referrer.leaguePoints || 0) + this.REFERRER_LP_BONUS;
      
      // Track referral stats
      if (!referrer.stats) {
        referrer.stats = {} as any;
      }
      (referrer.stats as any).referralsCount = ((referrer.stats as any).referralsCount || 0) + 1;
      
      await referrer.save();

      // Create notification for referrer
      await this.createReferralNotification(referrerWallet, newUserWallet, this.REFERRER_XP_BONUS, this.REFERRER_LP_BONUS);
    }

    // Mark bonus as awarded
    (newUser as any).referralBonusAwarded = true;
    await newUser.save();

    this.logger.log(`Referral bonus awarded: ${referrerWallet} received ${this.REFERRER_XP_BONUS} XP for referring ${newUserWallet}`);

    return {
      success: true,
      referrer: referrerWallet,
      xpAwarded: this.REFERRER_XP_BONUS,
      lpAwarded: this.REFERRER_LP_BONUS,
    };
  }

  /**
   * Create notification for referral bonus
   */
  private async createReferralNotification(
    referrerWallet: string, 
    newUserWallet: string,
    xp: number,
    lp: number
  ): Promise<void> {
    const notificationsCollection = this.connection.collection('notifications');
    
    await notificationsCollection.insertOne({
      wallet: referrerWallet,
      type: 'referral_bonus',
      title: 'Referral Bonus Earned!',
      message: `You earned +${xp} XP and +${lp} League Points`,
      body: `A user you referred made their first bet!`,
      read: false,
      data: {
        newUserWallet: `${newUserWallet.slice(0, 6)}...${newUserWallet.slice(-4)}`,
        xpEarned: xp,
        lpEarned: lp,
      },
      createdAt: new Date(),
    });
  }

  /**
   * Get user's share stats
   */
  async getUserShareStats(wallet: string): Promise<any> {
    const shareLinks = await this.shareLinkModel.find({ createdByWallet: wallet }).lean().exec();
    
    const totalLinks = shareLinks.length;
    const totalClicks = shareLinks.reduce((sum, link) => sum + (link.clickCount || 0), 0);
    const totalConversions = shareLinks.reduce((sum, link) => sum + (link.conversionCount || 0), 0);
    
    // Get referral count from analyst
    const analyst = await this.analystModel.findOne({ wallet }).lean().exec();
    const referralsCount = (analyst?.stats as any)?.referralsCount || 0;

    return {
      totalLinks,
      totalClicks,
      totalConversions,
      referralsCount,
      conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0',
    };
  }

  /**
   * Get top referrers leaderboard
   */
  async getTopReferrers(limit: number = 10): Promise<any[]> {
    const analysts = await this.analystModel
      .find({ 'stats.referralsCount': { $gt: 0 } })
      .sort({ 'stats.referralsCount': -1 })
      .limit(limit)
      .lean()
      .exec();

    return analysts.map((a, index) => ({
      rank: index + 1,
      wallet: a.wallet,
      username: a.username || `${a.wallet.slice(0, 6)}...${a.wallet.slice(-4)}`,
      avatar: a.avatar || '/images/default-avatar.png',
      referralsCount: (a.stats as any)?.referralsCount || 0,
      xp: a.xp || 0,
    }));
  }

  /**
   * Build share URL
   */
  private buildShareUrl(shareId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://arena.fomo.com';
    return `${baseUrl}/s/${shareId}`;
  }

  /**
   * Track win share for XP reward (+5 XP)
   */
  async trackWinShare(tokenId: string, platform: string, wallet?: string): Promise<any> {
    this.logger.log(`Win share tracked: token ${tokenId} on ${platform}`);

    const shareTracksCollection = this.connection.collection('share_tracks');
    const userStatsCollection = this.connection.collection('user_stats');

    // Check if already shared (prevent spam)
    const existing = await shareTracksCollection.findOne({
      tokenId: parseInt(tokenId),
      platform,
    });

    if (existing) {
      return { 
        success: true, 
        message: 'Already tracked',
        xpAwarded: 0,
      };
    }

    // Record share
    await shareTracksCollection.insertOne({
      tokenId: parseInt(tokenId),
      platform,
      wallet: wallet?.toLowerCase(),
      createdAt: new Date(),
    });

    // Award XP if wallet provided
    let xpAwarded = 0;
    if (wallet) {
      const userWallet = wallet.toLowerCase();
      const XP_SHARE_REWARD = 5;

      await userStatsCollection.updateOne(
        { wallet: userWallet },
        { 
          $inc: { xp: XP_SHARE_REWARD, sharesCount: 1 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );

      xpAwarded = XP_SHARE_REWARD;
      this.logger.log(`Awarded ${XP_SHARE_REWARD} XP to ${userWallet} for sharing`);
    }

    return {
      success: true,
      platform,
      tokenId,
      xpAwarded,
    };
  }
}
