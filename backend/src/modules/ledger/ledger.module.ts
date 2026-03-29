import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LedgerEntry, LedgerEntrySchema } from './ledger.schema';
import { LedgerService } from './ledger.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
