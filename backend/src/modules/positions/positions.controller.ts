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
import { PositionsService, PlaceBetDto } from './positions.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PositionStatus } from './positions.schema';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerType } from '../ledger/ledger.schema';

@Controller('positions')
export class PositionsController {
  constructor(
    private readonly positionsService: PositionsService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Get current user's positions
   * GET /api/positions/my
   */
  @Get('my')
  @UseGuards(AuthGuard)
  async getMyPositions(
    @Req() req: any,
    @Query() pagination: PaginationDto,
    @Query('status') status?: PositionStatus,
  ) {
    const { data, total } = await this.positionsService.getUserPositions(
      req.user.wallet,
      status,
      pagination.page,
      pagination.limit,
    );

    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get position by ID
   * GET /api/positions/:id
   */
  @Get(':id')
  async getPosition(@Param('id') id: string) {
    const position = await this.positionsService.getPositionById(id);
    return ApiResponse.success(position);
  }

  /**
   * Get positions by wallet (public)
   * GET /api/positions/by-wallet/:wallet
   */
  @Get('by-wallet/:wallet')
  async getPositionsByWallet(
    @Param('wallet') wallet: string,
    @Query() pagination: PaginationDto,
  ) {
    const { data, total } = await this.positionsService.getUserPositions(
      wallet.toLowerCase(),
      undefined,
      pagination.page,
      pagination.limit || 50,
    );
    return ApiResponse.paginated(data, total, pagination.page, pagination.limit || 50);
  }

  /**
   * Claim payout for won position
   * POST /api/positions/:id/claim
   */
  @Post(':id/claim')
  @UseGuards(AuthGuard)
  async claimPayout(@Param('id') id: string, @Req() req: any) {
    const position = await this.positionsService.claimPayout(id, req.user.wallet);
    
    // Credit payout to user balance
    if (position.payout && position.payout > 0) {
      await this.ledgerService.creditBalance(
        req.user.wallet,
        position.payout,
        LedgerType.PAYOUT,
        id,
        `Claimed payout for position ${id}`,
      );
    }
    
    return ApiResponse.success(position, `Payout of ${position.payout?.toFixed(2) || 0} USDT claimed successfully`);
  }

  /**
   * Refund position (for cancelled markets)
   * POST /api/positions/:id/refund
   */
  @Post(':id/refund')
  @UseGuards(AuthGuard)
  async refundPosition(@Param('id') id: string, @Req() req: any) {
    const position = await this.positionsService.refundPosition(id, req.user.wallet);
    
    return ApiResponse.success(position, `Refund of ${position.payout?.toFixed(2) || 0} USDT processed successfully`);
  }
}

/**
 * Betting controller under markets
 */
@Controller('markets')
export class BettingController {
  constructor(private readonly positionsService: PositionsService) {}

  /**
   * Bet preview - calculate potential returns
   * POST /api/markets/:id/bet-preview
   */
  @Post(':id/bet-preview')
  async betPreview(@Param('id') marketId: string, @Body() dto: PlaceBetDto) {
    const preview = await this.positionsService.betPreview(marketId, dto);
    return ApiResponse.success(preview);
  }

  /**
   * Place bet - create position
   * POST /api/markets/:id/bet
   */
  @Post(':id/bet')
  @UseGuards(AuthGuard)
  async placeBet(
    @Param('id') marketId: string,
    @Body() dto: PlaceBetDto,
    @Req() req: any,
  ) {
    const position = await this.positionsService.placeBet(
      marketId,
      req.user.wallet,
      dto,
    );
    return ApiResponse.success(position, 'Bet placed successfully');
  }

  /**
   * Get positions for market
   * GET /api/markets/:id/positions
   */
  @Get(':id/positions')
  async getMarketPositions(@Param('id') marketId: string) {
    const positions = await this.positionsService.getPositionsByMarket(marketId);
    return ApiResponse.success(positions);
  }
}
