import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  Headers,
} from '@nestjs/common';
import { AnalystsService } from './analysts.service';
import { UpdateAnalystDto } from './analysts.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('analysts')
export class AnalystsController {
  constructor(private readonly analystsService: AnalystsService) {}

  /**
   * Get analyst profile
   * GET /api/analysts/:wallet
   */
  @Get(':wallet')
  async getProfile(@Param('wallet') wallet: string) {
    const profile = await this.analystsService.getProfile(wallet);
    return ApiResponse.success(profile);
  }

  /**
   * Update analyst profile
   * PUT /api/analysts/:wallet
   */
  @Put(':wallet')
  async updateProfile(
    @Param('wallet') wallet: string,
    @Body() dto: UpdateAnalystDto,
    @Headers('x-wallet-address') authWallet?: string,
  ) {
    // In production, verify authWallet === wallet
    const analyst = await this.analystsService.updateProfile(wallet, dto);
    return ApiResponse.success(analyst, 'Profile updated');
  }

  /**
   * Get top predictions for analyst
   * GET /api/analysts/:wallet/top-predictions
   */
  @Get(':wallet/top-predictions')
  async getTopPredictions(
    @Param('wallet') wallet: string,
    @Query('limit') limit?: string,
  ) {
    const predictions = await this.analystsService.getTopPredictions(
      wallet,
      limit ? parseInt(limit, 10) : 5,
    );
    return ApiResponse.success(predictions);
  }
}
