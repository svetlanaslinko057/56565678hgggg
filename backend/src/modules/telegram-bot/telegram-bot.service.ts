import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Telegraf, Context, Markup } from 'telegraf';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf | null = null;
  private readonly botToken: string;
  private readonly webAppUrl: string;

  constructor(
    @InjectConnection() private connection: Connection,
  ) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.webAppUrl = process.env.FRONTEND_URL || 'https://cold-start-setup.preview.emergentagent.com';
    // Use /tg path for mobile Mini App
    this.webAppUrl = this.webAppUrl + '/tg';
  }

  async onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured, bot disabled');
      return;
    }

    try {
      this.bot = new Telegraf(this.botToken);
      await this.setupCommands();
      await this.setupHandlers();
      
      // Start polling
      this.bot.launch({
        dropPendingUpdates: true,
      });
      
      this.logger.log('Telegram bot started successfully!');
    } catch (error) {
      this.logger.error('Failed to start Telegram bot:', error);
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
      this.logger.log('Telegram bot stopped');
    }
  }

  private async setupCommands() {
    if (!this.bot) return;

    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot and open Arena' },
      { command: 'markets', description: 'View active prediction markets' },
      { command: 'duels', description: 'View active duels' },
      { command: 'profile', description: 'View your profile and stats' },
      { command: 'leaderboard', description: 'View top predictors' },
      { command: 'help', description: 'Show help and commands' },
    ]);
  }

  private async setupHandlers() {
    if (!this.bot) return;

    // /start command
    this.bot.start(async (ctx) => {
      const startParam = ctx.startPayload;
      const user = ctx.from;
      
      this.logger.log(`/start from ${user?.id} with param: ${startParam}`);

      // Parse deep link
      let deepLink = '';
      if (startParam) {
        if (startParam.startsWith('market_')) {
          deepLink = `?startapp=${startParam}`;
        } else if (startParam.startsWith('duel_')) {
          deepLink = `?startapp=${startParam}`;
        } else if (startParam.startsWith('ref_')) {
          deepLink = `?startapp=${startParam}`;
          // Track referral
          await this.trackReferral(user?.id?.toString(), startParam.replace('ref_', ''));
        } else if (startParam.startsWith('rival_')) {
          deepLink = `?tab=duels&rival=${startParam.replace('rival_', '')}`;
        } else if (startParam === 'leaderboard') {
          deepLink = `?tab=leagues`;
        } else if (startParam.startsWith('win_')) {
          deepLink = `?share=${startParam.replace('win_', '')}`;
        }
      }

      const welcomeMessage = `
🔥 *Welcome to FOMO Arena!*

The ultimate prediction market on BSC Testnet.

*What you can do:*
• 🎯 Bet on crypto predictions
• ⚔️ Challenge rivals to duels
• 🏆 Climb the leaderboard
• 💰 Win and share your victories

*Quick Actions:*
`;

      await ctx.replyWithMarkdown(
        welcomeMessage,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Open Arena', `${this.webAppUrl}${deepLink}`)],
          [
            Markup.button.callback('📊 Markets', 'show_markets'),
            Markup.button.callback('⚔️ Duels', 'show_duels'),
          ],
          [
            Markup.button.callback('🏆 Leaderboard', 'show_leaderboard'),
            Markup.button.callback('👤 Profile', 'show_profile'),
          ],
        ])
      );
    });

    // /markets command
    this.bot.command('markets', async (ctx) => {
      const markets = await this.getActiveMarkets(5);
      
      if (markets.length === 0) {
        await ctx.reply('No active markets yet. Be the first to create one!', 
          Markup.inlineKeyboard([
            [Markup.button.webApp('➕ Create Market', `${this.webAppUrl}?create=market`)],
          ])
        );
        return;
      }

      let message = '📊 *Active Prediction Markets*\n\n';
      
      markets.forEach((market, i) => {
        const yesOdds = market.yesOdds?.toFixed(2) || '1.50';
        const noOdds = market.noOdds?.toFixed(2) || '2.50';
        message += `${i + 1}. *${market.question?.substring(0, 50)}...*\n`;
        message += `   YES: ${yesOdds}x | NO: ${noOdds}x\n`;
        message += `   Volume: $${market.totalVolume?.toLocaleString() || 0}\n\n`;
      });

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🎯 View All Markets', this.webAppUrl)],
        ])
      );
    });

    // /duels command
    this.bot.command('duels', async (ctx) => {
      const duels = await this.getActiveDuels(5);
      
      if (duels.length === 0) {
        await ctx.reply('No active duels. Challenge someone!',
          Markup.inlineKeyboard([
            [Markup.button.webApp('⚔️ Create Duel', `${this.webAppUrl}?tab=duels`)],
          ])
        );
        return;
      }

      let message = '⚔️ *Active Duels*\n\n';
      
      duels.forEach((duel, i) => {
        const stake = duel.stakeAmount || 0;
        message += `${i + 1}. *${duel.predictionTitle?.substring(0, 40)}...*\n`;
        message += `   Stake: $${stake} | Pot: $${stake * 2}\n`;
        message += `   Status: ${duel.status}\n\n`;
      });

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp('⚔️ Join Duels', `${this.webAppUrl}?tab=duels`)],
        ])
      );
    });

    // /profile command
    this.bot.command('profile', async (ctx) => {
      const userId = ctx.from?.id?.toString();
      const profile = await this.getUserProfile(userId);

      if (!profile) {
        await ctx.reply('You haven\'t joined the Arena yet!',
          Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Join Now', this.webAppUrl)],
          ])
        );
        return;
      }

      const message = `
👤 *Your Profile*

*Stats:*
• XP: ${profile.xp || 0}
• Wins: ${profile.wins || 0}
• Total Bets: ${profile.totalBets || 0}
• Win Rate: ${profile.winRate || 0}%

*Badges:* ${profile.badges?.length || 0}
`;

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp('👤 Full Profile', `${this.webAppUrl}/profile`)],
        ])
      );
    });

    // /leaderboard command
    this.bot.command('leaderboard', async (ctx) => {
      const leaders = await this.getLeaderboard(10);

      let message = '🏆 *Top Predictors*\n\n';
      
      leaders.forEach((user, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        message += `${medal} *${user.name || user.wallet?.substring(0, 8)}*\n`;
        message += `   XP: ${user.xp || 0} | Wins: ${user.wins || 0}\n\n`;
      });

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🏆 Full Leaderboard', `${this.webAppUrl}?tab=leagues`)],
        ])
      );
    });

    // /help command
    this.bot.command('help', async (ctx) => {
      const helpMessage = `
🔥 *FOMO Arena Bot Commands*

/start - Start the bot
/markets - View active markets
/duels - View active duels  
/profile - Your stats and badges
/leaderboard - Top predictors
/help - This message

*How to Play:*
1. Connect your wallet
2. Find a market or create one
3. Place your bet (YES/NO)
4. Win and share! 🎉

*Tips:*
• Challenge rivals to duels ⚔️
• Complete badges for XP 🎖️
• Share wins for bonus XP 📤
`;

      await ctx.replyWithMarkdown(
        helpMessage,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Open Arena', this.webAppUrl)],
        ])
      );
    });

    // Callback handlers
    this.bot.action('show_markets', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup(undefined);
      // Trigger markets command
      const markets = await this.getActiveMarkets(5);
      
      let message = '📊 *Active Markets*\n\n';
      if (markets.length === 0) {
        message = 'No active markets yet.';
      } else {
        markets.forEach((market, i) => {
          message += `${i + 1}. ${market.question?.substring(0, 50)}...\n`;
        });
      }

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🎯 Open Markets', this.webAppUrl)],
        ])
      );
    });

    this.bot.action('show_duels', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(
        '⚔️ View all active duels in the Arena!',
        Markup.inlineKeyboard([
          [Markup.button.webApp('⚔️ Open Duels', `${this.webAppUrl}?tab=duels`)],
        ])
      );
    });

    this.bot.action('show_leaderboard', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(
        '🏆 See who\'s leading the pack!',
        Markup.inlineKeyboard([
          [Markup.button.webApp('🏆 Open Leaderboard', `${this.webAppUrl}?tab=leagues`)],
        ])
      );
    });

    this.bot.action('show_profile', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(
        '👤 View your full profile and stats!',
        Markup.inlineKeyboard([
          [Markup.button.webApp('👤 Open Profile', `${this.webAppUrl}/profile`)],
        ])
      );
    });

    // Handle errors
    this.bot.catch((err, ctx) => {
      this.logger.error(`Bot error for ${ctx.updateType}:`, err);
    });
  }

  // Database helpers
  private async getActiveMarkets(limit: number = 5) {
    try {
      return await this.connection.collection('predictions')
        .find({ status: 'active' })
        .sort({ totalVolume: -1 })
        .limit(limit)
        .toArray();
    } catch {
      return [];
    }
  }

  private async getActiveDuels(limit: number = 5) {
    try {
      return await this.connection.collection('duels')
        .find({ status: { $in: ['pending', 'active'] } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } catch {
      return [];
    }
  }

  private async getUserProfile(telegramId?: string) {
    if (!telegramId) return null;
    try {
      const user = await this.connection.collection('users')
        .findOne({ telegramId });
      if (!user) return null;
      
      const analyst = await this.connection.collection('analysts')
        .findOne({ wallet: user.wallet });
      
      return {
        ...user,
        xp: analyst?.xp || 0,
        wins: analyst?.stats?.wins || 0,
        totalBets: analyst?.stats?.totalBets || 0,
        winRate: analyst?.stats?.winRate || 0,
        badges: analyst?.badges || [],
      };
    } catch {
      return null;
    }
  }

  private async getLeaderboard(limit: number = 10) {
    try {
      return await this.connection.collection('analysts')
        .find({})
        .sort({ xp: -1 })
        .limit(limit)
        .toArray();
    } catch {
      return [];
    }
  }

  private async trackReferral(userId?: string, referrerId?: string) {
    if (!userId || !referrerId) return;
    try {
      await this.connection.collection('referrals').insertOne({
        userId,
        referrerId,
        createdAt: new Date(),
      });
      this.logger.log(`Referral tracked: ${userId} referred by ${referrerId}`);
    } catch (error) {
      this.logger.error('Failed to track referral:', error);
    }
  }

  // Public method to send notifications
  async sendNotification(telegramId: string, message: string, keyboard?: any) {
    if (!this.bot) return;
    
    try {
      await this.bot.telegram.sendMessage(
        telegramId,
        message,
        {
          parse_mode: 'Markdown',
          ...keyboard,
        }
      );
      this.logger.log(`Notification sent to ${telegramId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to ${telegramId}:`, error);
    }
  }

  // Send win notification
  async sendWinNotification(telegramId: string, amount: number, marketTitle: string, marketId: string) {
    const message = `
🎉 *Congratulations! You Won!*

💰 *+$${amount.toFixed(2)}*

Market: ${marketTitle.substring(0, 50)}...

Share your win and earn bonus XP!
`;

    await this.sendNotification(
      telegramId,
      message,
      Markup.inlineKeyboard([
        [Markup.button.webApp('📤 Share Win', `${this.webAppUrl}?share=win&market=${marketId}`)],
        [Markup.button.webApp('🎯 Play Again', this.webAppUrl)],
      ])
    );
  }

  // Send duel challenge notification
  async sendDuelChallenge(telegramId: string, challengerName: string, duelId: string, stake: number) {
    const message = `
⚔️ *Duel Challenge!*

*${challengerName}* challenged you to a duel!

💰 Stake: $${stake}
🏆 Pot: $${stake * 2}

Accept the challenge?
`;

    await this.sendNotification(
      telegramId,
      message,
      Markup.inlineKeyboard([
        [Markup.button.webApp('⚔️ Accept Duel', `${this.webAppUrl}?startapp=duel_${duelId}`)],
      ])
    );
  }

  // Send FOMO alert
  async sendFomoAlert(telegramId: string, type: string, data: any) {
    let message = '';
    let buttonText = 'View Market';
    let buttonUrl = this.webAppUrl;

    switch (type) {
      case 'edge_jump':
        message = `
⚡ *Edge Jumped!*

${data.marketTitle || 'Market'}

Edge: *+${data.edge}%*
AI Signal: ${data.signal}

Strong opportunity detected!
`;
        buttonUrl = `${this.webAppUrl}?startapp=market_${data.marketId}`;
        buttonText = '🎯 Bet Now';
        break;

      case 'whale_bet':
        message = `
🐋 *Whale Activity!*

${data.marketTitle || 'Market'}

*$${data.amount}* bet on ${data.side}

Follow the whale?
`;
        buttonUrl = `${this.webAppUrl}?startapp=market_${data.marketId}`;
        buttonText = '🐋 Follow Whale';
        break;

      case 'closing_soon':
        message = `
⏰ *Market Closing Soon!*

${data.marketTitle || 'Market'}

⏱ Closing in ${data.minutes}m
🔥 ${data.recentBets} bets last 5 min

Don't miss out!
`;
        buttonUrl = `${this.webAppUrl}?startapp=market_${data.marketId}`;
        buttonText = '⏰ Bet Before Close';
        break;

      case 'rival_pressure':
        message = `
⚔️ *Rival Alert!*

*${data.rivalName}* is on a ${data.streak}-win streak against you!

😤 Time for revenge?
`;
        buttonUrl = `${this.webAppUrl}?tab=duels&rival=${data.rivalWallet}`;
        buttonText = '⚔️ Challenge Back';
        break;

      case 'weekly_pressure':
        message = `
🏆 *Weekly Competition Update*

You're *#${data.rank}* with ${data.hoursLeft}h left!

${data.rank <= 10 ? '🔥 You\'re in Top 10!' : `Just ${data.rank - 10} spots from Top 10!`}

One more win could change everything!
`;
        buttonUrl = `${this.webAppUrl}?tab=leagues`;
        buttonText = '🏆 View Leaderboard';
        break;
    }

    if (!message) return;

    await this.sendNotification(
      telegramId,
      message,
      Markup.inlineKeyboard([
        [Markup.button.webApp(buttonText, buttonUrl)],
      ])
    );
  }
}
