import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { LedgerEntrySchema } from '../ledger/ledger.schema';
import { PositionSchema } from '../positions/positions.schema';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LedgerEntry', schema: LedgerEntrySchema },
      { name: 'Position', schema: PositionSchema },
    ]),
    LedgerModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
