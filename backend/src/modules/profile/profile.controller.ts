import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get current user's profile
   * GET /api/profile/me
   */
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@Req() req: any) {
    const profile = await this.profileService.getProfile(req.user.wallet);
    
    if (!profile) {
      return ApiResponse.error('Profile not found', 404);
    }
    
    return ApiResponse.success(profile);
  }

  /**
   * Update current user's profile
   * PATCH /api/profile/me
   */
  @Patch('me')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(
    @Req() req: any,
    @Body() body: {
      username?: string;
      avatar?: string;
      bio?: string;
      email?: string;
      socials?: { twitter?: string; discord?: string; telegram?: string; website?: string };
      notifications?: { email?: boolean; push?: boolean; marketing?: boolean; trades?: boolean; mentions?: boolean };
      privacy?: { showBalance?: boolean; showActivity?: boolean; showPositions?: boolean };
      security?: { twoFactorEnabled?: boolean; twoFactorMethod?: string | null };
    },
  ) {
    const profile = await this.profileService.updateProfile(req.user.wallet, body);
    return ApiResponse.success(profile, 'Profile updated successfully');
  }

  /**
   * Get current user's stats
   * GET /api/profile/me/stats
   */
  @Get('me/stats')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user statistics' })
  async getMyStats(@Req() req: any) {
    const stats = await this.profileService.getStats(req.user.wallet);
    return ApiResponse.success(stats);
  }

  /**
   * Get current user's positions
   * GET /api/profile/me/positions
   */
  @Get('me/positions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user positions' })
  async getMyPositions(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.profileService.getPositions(
      req.user.wallet,
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: parseInt(page || '1'),
        limit: parseInt(limit || '20'),
        totalPages: Math.ceil(result.total / parseInt(limit || '20')),
      },
    };
  }

  /**
   * Get current user's activity
   * GET /api/profile/me/activity
   */
  @Get('me/activity')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user activity feed' })
  async getMyActivity(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const activity = await this.profileService.getActivity(
      req.user.wallet,
      parseInt(limit || '10'),
      type,
    );
    return ApiResponse.success(activity);
  }

  /**
   * Get public profile by wallet
   * GET /api/profile/:wallet
   */
  @Get(':wallet')
  @ApiOperation({ summary: 'Get public profile by wallet' })
  async getPublicProfile(@Req() req: any) {
    const wallet = req.params.wallet;
    const profile = await this.profileService.getProfile(wallet);
    
    if (!profile) {
      return ApiResponse.error('Profile not found', 404);
    }
    
    return ApiResponse.success(profile);
  }

  /**
   * Get public stats by wallet
   * GET /api/profile/:wallet/stats
   */
  @Get(':wallet/stats')
  @ApiOperation({ summary: 'Get public stats by wallet' })
  async getPublicStats(@Req() req: any) {
    const wallet = req.params.wallet;
    const stats = await this.profileService.getStats(wallet);
    return ApiResponse.success(stats);
  }
}
