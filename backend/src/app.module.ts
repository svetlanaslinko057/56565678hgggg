import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { Web3Module } from './infra/web3/web3.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { PositionsModule } from './modules/positions/positions.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { DuelsModule } from './modules/duels/duels.module';
import { RivalsModule } from './modules/rivals/rivals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { AnalystsModule } from './modules/analysts/analysts.module';
import { MarketsModule } from './modules/markets/markets.module';
import { ActivityModule } from './modules/activity/activity.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ResolutionModule } from './modules/resolution/resolution.module';
import { LiquidityModule } from './modules/liquidity/liquidity.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { ShareModule } from './modules/share/share.module';
import { EventsModule } from './events/events.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MarketDraftModule } from './modules/market-drafts/market-draft.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { GrowthModule } from './modules/growth/growth.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { TwoFaModule } from './modules/twofa/twofa.module';
import { MirrorModule } from './modules/mirror/mirror.module';
import { XpModule } from './modules/xp/xp.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { TickerModule } from './modules/ticker/ticker.module';
import { VotingModule } from './modules/voting/voting.module';
import { TelegramAuthModule } from './modules/telegram-auth/telegram-auth.module';
import { MonetizationModule } from './modules/monetization/monetization.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { FomoEngineModule } from './modules/fomo-engine/fomo-engine.module';
import { GrowthLoopModule } from './modules/growth-loop/growth-loop.module';
import { ABTestingModule } from './modules/ab-testing/ab-testing.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10,  // 10 requests per minute default
    }]),
    ConfigModule,
    DatabaseModule,
    Web3Module,
    UsersModule,
    AuthModule,
    LiquidityModule,
    PredictionsModule,
    PositionsModule,
    MarketplaceModule,
    IndexerModule,
    MarketsModule,
    ActivityModule,
    DuelsModule,
    RivalsModule,
    NotificationsModule,
    SeasonsModule,
    LeaderboardModule,
    AnalystsModule,
    LedgerModule,
    ResolutionModule,
    WalletModule,
    AdminModule,
    ShareModule,
    EventsModule,
    RealtimeModule,
    MarketDraftModule,
    ReputationModule,
    GrowthModule,
    PricingModule,
    OracleModule,
    CommentsModule,
    ProfileModule,
    CloudinaryModule,
    TwoFaModule,
    MirrorModule,
    XpModule,
    DiscussionsModule,
    TickerModule,
    VotingModule,
    TelegramAuthModule,
    MonetizationModule,
    TelegramBotModule,
    FomoEngineModule,
    GrowthLoopModule,
    ABTestingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
