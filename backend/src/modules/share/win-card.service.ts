import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Position, PositionDocument, PositionStatus } from '../positions/positions.schema';
import { Prediction, PredictionDocument } from '../predictions/predictions.schema';
import { Duel, DuelDocument } from '../duels/duels.schema';
import { Analyst, AnalystDocument } from '../analysts/analysts.schema';

// Helper to validate ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

export interface WinCardData {
  positionId: string;
  title: string;
  market: string;
  side: string;
  entry: number;
  payout: number;
  profit: number;
  roi: string;
  rival?: string;
  rivalDefeated?: boolean;
  streak?: number;
  isTopTen?: boolean;
  badge?: string;
  refLink: string;
  telegramShareUrl: string;
  shareText: string;
}

@Injectable()
export class WinCardService {
  private readonly logger = new Logger(WinCardService.name);

  constructor(
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(Duel.name) private duelModel: Model<DuelDocument>,
    @InjectModel(Analyst.name) private analystModel: Model<AnalystDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Generate win card data for a position
   */
  async generateWinCardData(positionId: string, wallet?: string): Promise<WinCardData> {
    // Validate positionId format
    if (!isValidObjectId(positionId)) {
      throw new BadRequestException('Invalid position ID format');
    }

    // Find position
    const position = await this.positionModel.findById(positionId).lean().exec();
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Verify it's a won position
    if (position.status !== PositionStatus.WON && position.status !== PositionStatus.CLAIMED) {
      throw new BadRequestException('Position is not a winning position');
    }

    // Get market data
    const market = await this.predictionModel.findById(position.marketId).lean().exec();
    const marketTitle = market?.question || 'Prediction Market';

    // Calculate payout and profit
    const payout = position.payout || position.potentialReturn || 0;
    const profit = payout - position.stake;
    const roi = position.stake > 0 ? ((profit / position.stake) * 100).toFixed(1) : '0';

    // Check for rival (duel)
    let rivalWallet: string | undefined;
    let rivalDefeated = false;

    const duel = await this.duelModel.findOne({
      $or: [
        { creatorWallet: position.wallet, winnerWallet: position.wallet },
        { opponentWallet: position.wallet, winnerWallet: position.wallet }
      ],
      marketId: position.marketId,
      status: 'finished'
    }).lean().exec();

    if (duel) {
      rivalWallet = duel.creatorWallet === position.wallet 
        ? duel.opponentWallet 
        : duel.creatorWallet;
      rivalDefeated = true;
    }

    // Check user stats for streak and top 10
    let streak = 0;
    let isTopTen = false;
    let badge: string | undefined;

    const analyst = await this.analystModel.findOne({ wallet: position.wallet }).lean().exec();
    if (analyst) {
      streak = (analyst.stats as any)?.currentStreak || 0;
      
      // Check leaderboard position
      const weeklyLeaderboard = this.connection.collection('leaderboard_weekly');
      const userRank = await weeklyLeaderboard.findOne({ wallet: position.wallet });
      if (userRank && (userRank as any).rank <= 10) {
        isTopTen = true;
      }

      // Determine badge based on achievements
      if (streak >= 5) {
        badge = '5-Win Streak';
      } else if (streak >= 3) {
        badge = '3-Win Streak';
      }
      if (rivalDefeated) {
        badge = badge ? `${badge} + Rival Defeated` : 'Rival Defeated';
      }
      if (isTopTen) {
        badge = badge ? `${badge} + Top 10` : 'Top 10 This Week';
      }
    }

    // Generate ref link
    const baseUrl = process.env.FRONTEND_URL || 'https://t.me/bot';
    const refLink = `${baseUrl}?startapp=market_${position.marketId}`;

    // Generate share text
    const shareText = this.generateShareText(payout, marketTitle, rivalWallet, streak, isTopTen);
    
    // Telegram share URL
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;

    return {
      positionId,
      title: `I won $${payout.toFixed(2)}`,
      market: marketTitle,
      side: position.outcomeLabel || 'YES',
      entry: position.stake,
      payout,
      profit,
      roi,
      rival: rivalWallet ? this.shortenWallet(rivalWallet) : undefined,
      rivalDefeated,
      streak: streak > 0 ? streak : undefined,
      isTopTen,
      badge,
      refLink,
      telegramShareUrl,
      shareText,
    };
  }

  /**
   * Generate share text for Telegram
   */
  private generateShareText(
    payout: number, 
    market: string, 
    rival?: string, 
    streak?: number, 
    isTopTen?: boolean
  ): string {
    let text = `I just won $${payout.toFixed(2)} on FOMO Arena!\n\n`;
    text += `${market.substring(0, 50)}${market.length > 50 ? '...' : ''}\n\n`;
    
    if (rival) {
      text += `Defeated rival: ${this.shortenWallet(rival)}\n`;
    }
    if (streak && streak >= 3) {
      text += `${streak}-Win Streak!\n`;
    }
    if (isTopTen) {
      text += `Top 10 This Week!\n`;
    }
    
    text += `\nJoin the Arena`;
    return text;
  }

  /**
   * Shorten wallet address
   */
  private shortenWallet(wallet: string): string {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  }

  /**
   * Track share action for analytics
   */
  async trackShare(positionId: string, wallet: string): Promise<{ tracked: boolean }> {
    const sharesCollection = this.connection.collection('share_tracking');
    
    await sharesCollection.insertOne({
      positionId,
      wallet,
      type: 'win_card',
      platform: 'telegram',
      createdAt: new Date(),
    });

    // Award XP for sharing
    await this.analystModel.updateOne(
      { wallet },
      { 
        $inc: { xp: 5 },
        $set: { lastShareAt: new Date() }
      }
    );

    this.logger.log(`Win card shared: ${positionId} by ${wallet}`);
    return { tracked: true };
  }

  /**
   * Get recent wins for user profile
   */
  async getRecentWins(wallet: string, limit: number = 10): Promise<WinCardData[]> {
    const positions = await this.positionModel
      .find({
        wallet: wallet.toLowerCase(),
        status: { $in: [PositionStatus.WON, PositionStatus.CLAIMED] }
      })
      .sort({ resolvedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    const winCards: WinCardData[] = [];
    
    for (const position of positions) {
      try {
        const cardData = await this.generateWinCardData((position as any)._id.toString(), wallet);
        winCards.push(cardData);
      } catch (error) {
        this.logger.warn(`Failed to generate win card for ${(position as any)._id}: ${error.message}`);
      }
    }

    return winCards;
  }
}
