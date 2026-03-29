import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketDraft, MarketDraftSchema } from './market-draft.schema';
import { MarketVote, MarketVoteSchema } from './market-vote.schema';
import { MarketDraftService } from './market-draft.service';
import { OracleService } from './oracle.service';
import { MarketDraftController, AdminMarketDraftController } from './market-draft.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketDraft.name, schema: MarketDraftSchema },
      { name: MarketVote.name, schema: MarketVoteSchema },
    ]),
    ConfigModule,
    ScheduleModule.forRoot(),
    LedgerModule,
    forwardRef(() => PredictionsModule),
    NotificationsModule,
    WalletModule,
  ],
  controllers: [MarketDraftController, AdminMarketDraftController],
  providers: [MarketDraftService, OracleService],
  exports: [MarketDraftService, OracleService],
})
export class MarketDraftModule {}
