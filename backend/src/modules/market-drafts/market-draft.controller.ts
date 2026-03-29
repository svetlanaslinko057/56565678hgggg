import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketDraftService } from './market-draft.service';
import { OracleService } from './oracle.service';
import {
  CreateMarketDraftDto,
  CastVoteDto,
  CreateDisputeDto,
  RejectDraftDto,
} from './market-draft.dto';

// Simple auth guard that extracts wallet from header or body
const extractWallet = (req: any): string => {
  return req.headers['x-wallet-address'] || 
         req.body?.wallet || 
         req.query?.wallet ||
         '0xanonymous';
};

@ApiTags('Market Drafts')
@Controller('markets/drafts')
export class MarketDraftController {
  constructor(
    private readonly draftService: MarketDraftService,
    private readonly oracleService: OracleService,
  ) {}

  // ==================== Config ====================

  @Get('config')
  @ApiOperation({ summary: 'Get market creation config' })
  getConfig() {
    const config = this.draftService.getConfig();
    return { success: true, data: config };
  }

  // ==================== User Draft Management ====================

  @Post()
  @ApiOperation({ summary: 'Create new market draft' })
  async createDraft(@Body() dto: CreateMarketDraftDto, @Req() req: any) {
    const wallet = extractWallet(req);
    const data = await this.draftService.createDraft(dto, wallet);
    return { success: true, data };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my drafts' })
  async getMyDrafts(@Req() req: any) {
    const wallet = extractWallet(req);
    const data = await this.draftService.getMyDrafts(wallet);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draft by ID' })
  async getDraft(@Param('id') id: string) {
    const data = await this.draftService.getDraftById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft' })
  async updateDraft(
    @Param('id') id: string,
    @Body() dto: Partial<CreateMarketDraftDto>,
    @Req() req: any,
  ) {
    const wallet = extractWallet(req);
    const data = await this.draftService.updateDraft(id, dto, wallet);
    return { success: true, data };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit draft for review' })
  async submitDraft(@Param('id') id: string, @Req() req: any) {
    const wallet = extractWallet(req);
    const data = await this.draftService.submitForReview(id, wallet);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete draft' })
  async cancelDraft(@Param('id') id: string, @Req() req: any) {
    const wallet = extractWallet(req);
    await this.draftService.cancelDraft(id, wallet);
    return { success: true, message: 'Draft canceled, stake returned' };
  }

  // ==================== Oracle ====================

  @Get('oracle/price/:asset')
  @ApiOperation({ summary: 'Get current price from oracle' })
  async getOraclePrice(@Param('asset') asset: string) {
    const data = await this.oracleService.fetchPrice(asset);
    return { success: data.success, data };
  }

  @Post('oracle/evaluate')
  @ApiOperation({ summary: 'Evaluate oracle condition' })
  async evaluateOracle(
    @Body() condition: { source: string; asset: string; operator: string; value: number },
  ) {
    const data = await this.oracleService.evaluateCondition(condition);
    return { success: data.success, data };
  }

  // ==================== Voting ====================

  @Get('votes/active')
  @ApiOperation({ summary: 'Get active vote sessions' })
  async getActiveVotes() {
    const data = await this.draftService.getActiveVotes();
    return { success: true, data };
  }

  @Get('votes/market/:marketId')
  @ApiOperation({ summary: 'Get vote session for market' })
  async getVoteByMarket(@Param('marketId') marketId: string) {
    const data = await this.draftService.getVoteByMarket(marketId);
    return { success: true, data };
  }

  @Post('votes/:marketId/dispute')
  @ApiOperation({ summary: 'Create dispute / vote session' })
  async createDispute(
    @Param('marketId') marketId: string,
    @Body() dto: CreateDisputeDto,
    @Req() req: any,
  ) {
    const wallet = extractWallet(req);
    const data = await this.draftService.createDispute(marketId, dto, wallet);
    return { success: true, data };
  }

  @Post('votes/:voteId/cast')
  @ApiOperation({ summary: 'Cast vote' })
  async castVote(
    @Param('voteId') voteId: string,
    @Body() dto: CastVoteDto,
    @Req() req: any,
  ) {
    const wallet = extractWallet(req);
    const data = await this.draftService.castVote(voteId, wallet, dto);
    return { success: true, data };
  }
}

// Admin endpoints for market drafts
@ApiTags('Admin - Market Drafts')
@Controller('admin/drafts')
export class AdminMarketDraftController {
  constructor(private readonly draftService: MarketDraftService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending drafts for moderation' })
  async getPendingDrafts() {
    const data = await this.draftService.getPendingDrafts();
    return { success: true, data };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve draft and publish market' })
  async approveDraft(@Param('id') id: string, @Req() req: any) {
    const adminWallet = req.headers['x-admin-wallet'] || 'admin';
    const data = await this.draftService.approveDraft(id, adminWallet);
    return { success: true, data };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject draft' })
  async rejectDraft(
    @Param('id') id: string,
    @Body() dto: RejectDraftDto,
    @Req() req: any,
  ) {
    const adminWallet = req.headers['x-admin-wallet'] || 'admin';
    const data = await this.draftService.rejectDraft(
      id,
      adminWallet,
      dto.reason,
      dto.burnStake,
    );
    return { success: true, data };
  }

  @Post('votes/:voteId/finalize')
  @ApiOperation({ summary: 'Finalize vote session' })
  async finalizeVote(@Param('voteId') voteId: string, @Req() req: any) {
    const adminWallet = req.headers['x-admin-wallet'] || 'admin';
    const data = await this.draftService.finalizeVote(voteId, adminWallet);
    return { success: true, data };
  }
}
