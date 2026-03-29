import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument, ListingStatus } from './marketplace.schema';
import { Position, PositionDocument, PositionStatus } from '../positions/positions.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectModel(Listing.name)
    private listingModel: Model<ListingDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * List position for sale
   */
  async listPosition(
    positionId: string,
    wallet: string,
    price: number,
  ): Promise<Listing> {
    // Get position
    const position = await this.positionModel.findById(positionId);
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Validate ownership
    if (position.wallet !== wallet.toLowerCase()) {
      throw new BadRequestException('Not your position');
    }

    // Validate status
    if (position.status !== PositionStatus.OPEN) {
      throw new BadRequestException('Position cannot be listed');
    }

    // Check if already listed
    const existingListing = await this.listingModel.findOne({
      positionId,
      status: ListingStatus.ACTIVE,
    });
    if (existingListing) {
      throw new BadRequestException('Position is already listed');
    }

    // Create listing
    const listing = await this.listingModel.create({
      positionId,
      tokenId: position.nft?.tokenId,
      contract: position.nft?.contract,
      sellerWallet: wallet.toLowerCase(),
      price,
      status: ListingStatus.ACTIVE,
      marketId: position.marketId,
      outcomeLabel: position.outcomeLabel,
      stake: position.stake,
      odds: position.odds,
      potentialReturn: position.potentialReturn,
    });

    // Update position status
    position.status = PositionStatus.LISTED;
    await position.save();

    this.logger.log(`Position ${positionId} listed for ${price} USDT`);

    return listing;
  }

  /**
   * Cancel listing
   */
  async cancelListing(listingId: string, wallet: string): Promise<Listing> {
    const listing = await this.listingModel.findById(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerWallet !== wallet.toLowerCase()) {
      throw new BadRequestException('Not your listing');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not active');
    }

    // Update listing
    listing.status = ListingStatus.CANCELED;
    listing.canceledAt = new Date();
    await listing.save();

    // Update position
    await this.positionModel.updateOne(
      { _id: listing.positionId },
      { status: PositionStatus.OPEN },
    );

    this.logger.log(`Listing ${listingId} canceled`);

    return listing;
  }

  /**
   * Buy position
   */
  async buyPosition(listingId: string, buyerWallet: string): Promise<Listing> {
    const listing = await this.listingModel.findById(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not active');
    }

    if (listing.sellerWallet === buyerWallet.toLowerCase()) {
      throw new BadRequestException('Cannot buy your own listing');
    }

    // Update listing
    listing.status = ListingStatus.SOLD;
    listing.buyerWallet = buyerWallet.toLowerCase();
    listing.soldAt = new Date();
    await listing.save();

    // Transfer position ownership
    await this.positionModel.updateOne(
      { _id: listing.positionId },
      {
        wallet: buyerWallet.toLowerCase(),
        status: PositionStatus.OPEN,
      },
    );

    // Send notifications
    try {
      // Notify seller
      await this.notificationsService.create({
        userWallet: listing.sellerWallet,
        type: 'position_sold' as any,
        title: 'Position Sold',
        message: `Your position was sold for ${listing.price} USDT`,
        payload: {
          listingId: (listing as any)._id.toString(),
          positionId: listing.positionId,
          price: listing.price,
        },
      });

      // Notify buyer
      await this.notificationsService.create({
        userWallet: buyerWallet,
        type: 'position_bought' as any,
        title: 'Position Purchased',
        message: `You purchased a position for ${listing.price} USDT`,
        payload: {
          listingId: (listing as any)._id.toString(),
          positionId: listing.positionId,
          price: listing.price,
        },
      });
    } catch (error) {
      this.logger.warn(`Notification failed: ${error.message}`);
    }

    this.logger.log(`Listing ${listingId} sold to ${buyerWallet}`);

    return listing;
  }

  /**
   * Get active listings
   */
  async getActiveListings(
    marketId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Listing[]; total: number }> {
    const query: any = { status: ListingStatus.ACTIVE };
    if (marketId) {
      query.marketId = marketId;
    }

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.listingModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Get user's listings
   */
  async getUserListings(
    wallet: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Listing[]; total: number }> {
    const query = { sellerWallet: wallet.toLowerCase() };

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.listingModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Get listing by ID
   */
  async getListingById(id: string): Promise<Listing> {
    const listing = await this.listingModel.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }
}
