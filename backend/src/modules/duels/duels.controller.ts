import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { DuelsService } from './duels.service';
import { CreateDuelDto, DuelFiltersDto } from './duels.dto';
import { DuelStatus } from './duels.schema';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('duels')
export class DuelsController {
  constructor(private readonly duelsService: DuelsService) {}

  /**
   * Create a new duel
   * POST /api/duels
   */
  @Post()
  async create(
    @Body() dto: CreateDuelDto,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    // In production, get wallet from auth/JWT
    const wallet = walletAddress || '0xDefaultWallet';
    const duel = await this.duelsService.create(dto, wallet);
    return ApiResponse.success(duel, 'Duel created successfully');
  }

  /**
   * Get all duels with filters
   * GET /api/duels
   */
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: DuelStatus,
    @Query('wallet') wallet?: string,
    @Query('marketId') marketId?: string,
  ) {
    const filters: DuelFiltersDto = {
      status,
      wallet,
      marketId,
    };

    const { data, total } = await this.duelsService.findAll(
      filters,
      pagination.page,
      pagination.limit,
    );

    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get open duels (available to join)
   * GET /api/duels/open
   */
  @Get('open')
  async getOpenDuels(@Query() pagination: PaginationDto) {
    const { data, total } = await this.duelsService.getOpenDuels(
      pagination.page,
      pagination.limit,
    );
    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get duels by wallet (public)
   * GET /api/duels/by-wallet/:wallet
   */
  @Get('by-wallet/:wallet')
  async getDuelsByWallet(
    @Param('wallet') wallet: string,
    @Query() pagination: PaginationDto,
  ) {
    const { data, total } = await this.duelsService.findAll(
      { wallet: wallet.toLowerCase() },
      pagination.page,
      pagination.limit || 50,
    );
    return ApiResponse.paginated(data, total, pagination.page, pagination.limit || 50);
  }

  /**
   * Get duel summary for current user
   * GET /api/duels/summary
   */
  @Get('summary')
  async getSummary(@Headers('x-wallet-address') walletAddress?: string) {
    const wallet = walletAddress || '0xDefaultWallet';
    const summary = await this.duelsService.getSummary(wallet);
    return ApiResponse.success(summary);
  }

  /**
   * Get user's duel history
   * GET /api/duels/history
   */
  @Get('history')
  async getHistory(
    @Query() pagination: PaginationDto,
    @Query('type') type?: 'all' | 'active' | 'settled',
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const { data, total } = await this.duelsService.getUserHistory(
      wallet,
      type || 'all',
      pagination.page,
      pagination.limit,
    );
    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  /**
   * Get top rivals for current user
   * GET /api/duels/rivals
   */
  @Get('rivals')
  async getTopRivals(
    @Query('limit') limit?: number,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const rivals = await this.duelsService.getTopRivals(wallet, limit || 5);
    return ApiResponse.success(rivals);
  }

  /**
   * Get specific duel by ID
   * GET /api/duels/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const duel = await this.duelsService.findById(id);
    return ApiResponse.success(duel);
  }

  /**
   * Accept a duel
   * POST /api/duels/:id/accept
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('id') id: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const duel = await this.duelsService.accept(id, wallet);
    return ApiResponse.success(duel, 'Duel accepted');
  }

  /**
   * Decline a duel
   * POST /api/duels/:id/decline
   */
  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  async decline(
    @Param('id') id: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const duel = await this.duelsService.decline(id, wallet);
    return ApiResponse.success(duel, 'Duel declined');
  }

  /**
   * Cancel a duel (creator only)
   * POST /api/duels/:id/cancel
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Headers('x-wallet-address') walletAddress?: string,
  ) {
    const wallet = walletAddress || '0xDefaultWallet';
    const duel = await this.duelsService.cancel(id, wallet);
    return ApiResponse.success(duel, 'Duel canceled');
  }

  /**
   * Resolve duels by market (internal/admin endpoint)
   * POST /api/duels/resolve-market/:marketId
   */
  @Post('resolve-market/:marketId')
  @HttpCode(HttpStatus.OK)
  async resolveByMarket(
    @Param('marketId') marketId: string,
    @Body() body: { winningOutcome: string },
  ) {
    const count = await this.duelsService.resolveByMarket(marketId, body.winningOutcome);
    return ApiResponse.success({ resolvedCount: count }, `Resolved ${count} duels`);
  }
}
