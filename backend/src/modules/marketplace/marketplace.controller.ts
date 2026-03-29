import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IsNumber, Min } from 'class-validator';
import { MarketplaceService } from './marketplace.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

class ListPositionDto {
  @IsNumber()
  @Min(0.01)
  price: number;
}

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * Get active listings
   * GET /api/marketplace/listings
   */
  @Get('listings')
  async getListings(
    @Query() pagination: PaginationDto,
    @Query('marketId') marketId?: string,
  ) {
    const { data, total } = await this.marketplaceService.getActiveListings(
      marketId,
      pagination.page,
      pagination.limit,
    );

    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get my listings
   * GET /api/marketplace/my-listings
   */
  @Get('my-listings')
  @UseGuards(AuthGuard)
  async getMyListings(@Req() req: any, @Query() pagination: PaginationDto) {
    const { data, total } = await this.marketplaceService.getUserListings(
      req.user.wallet,
      pagination.page,
      pagination.limit,
    );

    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get listing by ID
   * GET /api/marketplace/listings/:id
   */
  @Get('listings/:id')
  async getListing(@Param('id') id: string) {
    const listing = await this.marketplaceService.getListingById(id);
    return ApiResponse.success(listing);
  }

  /**
   * Buy listing
   * POST /api/marketplace/listings/:id/buy
   */
  @Post('listings/:id/buy')
  @UseGuards(AuthGuard)
  async buyListing(@Param('id') id: string, @Req() req: any) {
    const listing = await this.marketplaceService.buyPosition(id, req.user.wallet);
    return ApiResponse.success(listing, 'Position purchased successfully');
  }

  /**
   * Cancel listing
   * POST /api/marketplace/listings/:id/cancel
   */
  @Post('listings/:id/cancel')
  @UseGuards(AuthGuard)
  async cancelListing(@Param('id') id: string, @Req() req: any) {
    const listing = await this.marketplaceService.cancelListing(id, req.user.wallet);
    return ApiResponse.success(listing, 'Listing canceled');
  }
}

/**
 * Position listing endpoints
 */
@Controller('positions')
export class PositionListingController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * List position for sale
   * POST /api/positions/:id/list
   */
  @Post(':id/list')
  @UseGuards(AuthGuard)
  async listPosition(
    @Param('id') positionId: string,
    @Body() dto: ListPositionDto,
    @Req() req: any,
  ) {
    const listing = await this.marketplaceService.listPosition(
      positionId,
      req.user.wallet,
      dto.price,
    );
    return ApiResponse.success(listing, 'Position listed for sale');
  }
}
