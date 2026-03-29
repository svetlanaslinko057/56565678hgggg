import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Listing, ListingSchema } from './marketplace.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController, PositionListingController } from './marketplace.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
    AuthModule,
    UsersModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [MarketplaceController, PositionListingController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
