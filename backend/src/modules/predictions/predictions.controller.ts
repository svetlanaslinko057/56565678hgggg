import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PredictionsService, PredictionFilters } from './predictions.service';
import { CreatePredictionDto, UpdatePredictionDto } from './predictions.dto';
import { PredictionStatus } from './predictions.schema';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  async create(@Body() dto: CreatePredictionDto) {
    // TODO: Get userId from auth
    const userId = 'system';
    const prediction = await this.predictionsService.create(dto, userId);
    return ApiResponse.success(prediction, 'Prediction created');
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: PredictionStatus,
    @Query('category') category?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters: PredictionFilters = {
      status,
      category,
      riskLevel,
      search,
      sortBy,
      sortOrder,
    };

    const { data, total } = await this.predictionsService.findAll(
      filters,
      pagination.page,
      pagination.limit,
    );

    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const prediction = await this.predictionsService.findById(id);
    return ApiResponse.success(prediction);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePredictionDto) {
    const prediction = await this.predictionsService.update(id, dto);
    return ApiResponse.success(prediction, 'Prediction updated');
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitForReview(@Param('id') id: string) {
    const prediction = await this.predictionsService.submitForReview(id);
    return ApiResponse.success(prediction, 'Prediction submitted for review');
  }

  /**
   * Publish prediction → Create market on-chain
   * 
   * Flow:
   * 1. Prediction must be in REVIEW status
   * 2. Calls smart contract createMarket()
   * 3. Saves marketId to prediction
   * 4. Status → PUBLISHED
   * 
   * Response includes: marketId, chainId, contractAddress
   */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id') id: string,
    @Body() body?: { useOnChain?: boolean },
  ) {
    const useOnChain = body?.useOnChain !== false; // default true
    const prediction = await this.predictionsService.publish(id, useOnChain);
    return ApiResponse.success(prediction, 'Prediction published');
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  async lock(@Param('id') id: string) {
    const prediction = await this.predictionsService.lock(id);
    return ApiResponse.success(prediction, 'Prediction locked');
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param('id') id: string,
    @Body() body: { winningOutcome: string },
  ) {
    const prediction = await this.predictionsService.resolve(id, body.winningOutcome);
    return ApiResponse.success(prediction, 'Prediction resolved');
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const prediction = await this.predictionsService.cancel(id);
    return ApiResponse.success(prediction, 'Prediction canceled');
  }

  /**
   * Dispute market resolution
   * POST /api/predictions/:id/dispute
   */
  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  async dispute(
    @Param('id') id: string,
    @Body() body: { wallet: string; reason: string },
  ) {
    const prediction = await this.predictionsService.initiateDispute(id, body.wallet, body.reason);
    return ApiResponse.success(prediction, 'Dispute initiated. Voting is now open.');
  }

  /**
   * Submit vote on disputed market
   * POST /api/predictions/:id/vote
   */
  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  async vote(
    @Param('id') id: string,
    @Body() body: { wallet: string; outcomeId: string; votePower?: number },
  ) {
    const result = await this.predictionsService.submitVote(id, body.wallet, body.outcomeId, body.votePower || 1);
    return ApiResponse.success(result, 'Vote submitted');
  }

  // Voting endpoints moved to VotingModule (voting.controller.ts)
  // @Get(':id/voting') - handled by PredictionVotingController
  // @Post(':id/finalize-vote') - handled by VotingController
}
