import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { 
  CreateMarketDto, 
  ResolveMarketDto, 
  SimulateMarketDto, 
  UpdateUserDto,
  CreateSeasonDto,
  AdminPaginationDto,
} from './admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Dashboard ====================

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getStats() {
    const data = await this.adminService.getStats();
    return { success: true, data };
  }

  // ==================== Markets Management ====================

  @Get('markets')
  @ApiOperation({ summary: 'Get all markets (admin view)' })
  async getMarkets(@Query() params: AdminPaginationDto) {
    const result = await this.adminService.getMarkets(params);
    return { success: true, ...result };
  }

  @Get('markets/pending')
  @ApiOperation({ summary: 'Get pending markets for moderation' })
  async getPendingMarkets() {
    const data = await this.adminService.getPendingMarkets();
    return { success: true, data };
  }

  @Get('markets/:id')
  @ApiOperation({ summary: 'Get market details' })
  async getMarket(@Param('id') id: string) {
    const data = await this.adminService.getMarketById(id);
    return { success: true, data };
  }

  @Post('markets')
  @ApiOperation({ summary: 'Create new market' })
  async createMarket(@Body() dto: CreateMarketDto, @Req() req: any) {
    const data = await this.adminService.createMarket(dto, req.adminWallet);
    return { success: true, data };
  }

  @Patch('markets/:id')
  @ApiOperation({ summary: 'Update market' })
  async updateMarket(@Param('id') id: string, @Body() dto: Partial<CreateMarketDto>) {
    const data = await this.adminService.updateMarket(id, dto);
    return { success: true, data };
  }

  @Post('markets/:id/approve')
  @ApiOperation({ summary: 'Approve pending market' })
  async approveMarket(@Param('id') id: string) {
    const data = await this.adminService.approveMarket(id);
    return { success: true, data };
  }

  @Post('markets/:id/reject')
  @ApiOperation({ summary: 'Reject pending market' })
  async rejectMarket(@Param('id') id: string, @Body() body: { reason?: string }) {
    const data = await this.adminService.rejectMarket(id, body.reason);
    return { success: true, data };
  }

  @Post('markets/:id/lock')
  @ApiOperation({ summary: 'Lock market (stop betting)' })
  async lockMarket(@Param('id') id: string) {
    const data = await this.adminService.lockMarket(id);
    return { success: true, data };
  }

  @Post('markets/:id/resolve')
  @ApiOperation({ summary: 'Resolve market with winning outcome' })
  async resolveMarket(@Param('id') id: string, @Body() dto: ResolveMarketDto) {
    const data = await this.adminService.resolveMarket(id, dto);
    return { success: true, data };
  }

  @Post('markets/:id/simulate')
  @ApiOperation({ summary: 'Simulate market resolution (preview payouts)' })
  async simulateMarket(@Param('id') id: string, @Body() dto: SimulateMarketDto) {
    const data = await this.adminService.simulateMarket(id, dto);
    return { success: true, data };
  }

  @Delete('markets/:id')
  @ApiOperation({ summary: 'Delete draft/canceled market' })
  async deleteMarket(@Param('id') id: string) {
    await this.adminService.deleteMarket(id);
    return { success: true, message: 'Market deleted' };
  }

  // ==================== Users Management ====================

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query() params: AdminPaginationDto) {
    const result = await this.adminService.getUsers(params);
    return { success: true, ...result };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    const data = await this.adminService.getUserById(id);
    return { success: true, data };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.adminService.updateUser(id, dto);
    return { success: true, data };
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@Param('id') id: string) {
    const data = await this.adminService.banUser(id);
    return { success: true, data };
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@Param('id') id: string) {
    const data = await this.adminService.unbanUser(id);
    return { success: true, data };
  }

  // ==================== Positions Management ====================

  @Get('positions')
  @ApiOperation({ summary: 'Get all positions' })
  async getPositions(@Query() params: AdminPaginationDto) {
    const result = await this.adminService.getPositions(params);
    return { success: true, ...result };
  }

  // ==================== Duels Management ====================

  @Get('duels')
  @ApiOperation({ summary: 'Get all duels' })
  async getDuels(@Query() params: AdminPaginationDto) {
    const result = await this.adminService.getDuels(params);
    return { success: true, ...result };
  }

  @Post('duels/:id/resolve')
  @ApiOperation({ summary: 'Resolve duel with winner' })
  async resolveDuel(@Param('id') id: string, @Body() body: { winnerId: string }) {
    const data = await this.adminService.resolveDuel(id, body.winnerId);
    return { success: true, data };
  }

  @Post('duels/:id/cancel')
  @ApiOperation({ summary: 'Cancel duel' })
  async cancelDuel(@Param('id') id: string) {
    const data = await this.adminService.cancelDuel(id);
    return { success: true, data };
  }

  // ==================== Seasons Management ====================

  @Get('seasons')
  @ApiOperation({ summary: 'Get all seasons' })
  async getSeasons() {
    const data = await this.adminService.getSeasons();
    return { success: true, data };
  }

  @Post('seasons')
  @ApiOperation({ summary: 'Create new season' })
  async createSeason(@Body() dto: CreateSeasonDto) {
    const data = await this.adminService.createSeason(dto);
    return { success: true, data };
  }

  @Post('seasons/:id/start')
  @ApiOperation({ summary: 'Start season' })
  async startSeason(@Param('id') id: string) {
    const data = await this.adminService.startSeason(id);
    return { success: true, data };
  }

  @Post('seasons/:id/end')
  @ApiOperation({ summary: 'End season' })
  async endSeason(@Param('id') id: string) {
    const data = await this.adminService.endSeason(id);
    return { success: true, data };
  }

  // ==================== Activity & Risk ====================

  @Get('activity')
  @ApiOperation({ summary: 'Get live activity feed' })
  async getActivity(@Query() params: { limit?: number }) {
    const data = await this.adminService.getActivity(params);
    return { success: true, data };
  }

  @Get('risk/markets')
  @ApiOperation({ summary: 'Get risk monitor data' })
  async getRiskMonitor() {
    const data = await this.adminService.getRiskMonitor();
    return { success: true, data };
  }

  @Get('risk/whales')
  @ApiOperation({ summary: 'Get whale bets (>20% of market liquidity)' })
  async getWhaleBets() {
    const data = await this.adminService.getWhaleBets();
    return { success: true, data };
  }

  @Get('risk/skewed')
  @ApiOperation({ summary: 'Get skewed markets (>85% on one side)' })
  async getSkewedMarkets() {
    const data = await this.adminService.getSkewedMarkets();
    return { success: true, data };
  }

  @Get('risk/suspicious')
  @ApiOperation({ summary: 'Get suspicious users' })
  async getSuspiciousUsers() {
    const data = await this.adminService.getSuspiciousUsers();
    return { success: true, data };
  }

  // ==================== Resolution Center ====================

  @Get('resolution/pending')
  @ApiOperation({ summary: 'Get markets pending resolution' })
  async getMarketsForResolution() {
    const data = await this.adminService.getMarketsForResolution();
    return { success: true, data };
  }

  @Post('markets/:id/confirm-oracle')
  @ApiOperation({ summary: 'Confirm oracle result before resolution' })
  async confirmOracle(@Param('id') id: string, @Body() body: { outcomeId: string }) {
    const data = await this.adminService.confirmOracle(id, body.outcomeId);
    return { success: true, data };
  }

  @Post('markets/:id/override')
  @ApiOperation({ summary: 'Override oracle result (admin decision)' })
  async overrideResult(@Param('id') id: string, @Body() body: { outcomeId: string; reason: string }) {
    const data = await this.adminService.overrideResult(id, body.outcomeId, body.reason);
    return { success: true, data };
  }

  @Post('markets/:id/finalize')
  @ApiOperation({ summary: 'Finalize resolution and trigger payouts' })
  async finalizeResolution(@Param('id') id: string) {
    const data = await this.adminService.finalizeResolution(id);
    return { success: true, data };
  }

  @Post('markets/:id/pause')
  @ApiOperation({ summary: 'Pause market betting (emergency)' })
  async pauseMarket(@Param('id') id: string) {
    const data = await this.adminService.pauseMarket(id);
    return { success: true, data };
  }

  @Post('users/:wallet/freeze')
  @ApiOperation({ summary: 'Freeze user account' })
  async freezeUser(@Param('wallet') wallet: string) {
    const data = await this.adminService.freezeUserByWallet(wallet);
    return { success: true, data };
  }
}
