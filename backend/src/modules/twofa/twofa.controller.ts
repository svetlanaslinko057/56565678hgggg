import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { TwoFaService } from './twofa.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('2fa')
@Controller('2fa')
@UseGuards(ThrottlerGuard)
export class TwoFaController {
  constructor(private readonly twoFaService: TwoFaService) {}

  /**
   * Get 2FA status
   * GET /api/2fa/status
   */
  @Get('status')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get 2FA status for current user' })
  async getStatus(@Req() req: any) {
    const enabled = await this.twoFaService.isEnabled(req.user.wallet);
    return ApiResponse.success({ enabled });
  }

  /**
   * Generate 2FA setup (secret + QR code)
   * POST /api/2fa/setup
   */
  @Post('setup')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  async setup(@Req() req: any) {
    const enabled = await this.twoFaService.isEnabled(req.user.wallet);
    if (enabled) {
      throw new HttpException(
        '2FA is already enabled. Disable it first to regenerate.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.twoFaService.generateSecret(req.user.wallet);
    
    return ApiResponse.success({
      secret: result.secret,
      otpauthUrl: result.otpauthUrl,
      qrCode: result.qrCodeDataUrl,
    }, 'Scan the QR code with your authenticator app, then verify with a code');
  }

  /**
   * Verify and enable 2FA
   * POST /api/2fa/verify
   * Rate limited: 5 attempts per minute
   */
  @Post('verify')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify 2FA code and enable' })
  async verify(
    @Req() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token || body.token.length !== 6) {
      throw new HttpException(
        'Invalid token. Must be 6 digits.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.twoFaService.verifyAndEnable(req.user.wallet, body.token);
    
    if (!result.verified) {
      throw new HttpException(
        'Invalid verification code. Please try again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return ApiResponse.success({
      enabled: true,
      recoveryCodes: result.recoveryCodes,
    }, '2FA enabled successfully. Save your recovery codes in a safe place!');
  }

  /**
   * Validate 2FA token (for protected actions)
   * POST /api/2fa/validate
   * Rate limited: 5 attempts per minute
   */
  @Post('validate')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate 2FA token' })
  async validate(
    @Req() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) {
      throw new HttpException('Token required', HttpStatus.BAD_REQUEST);
    }

    const verified = await this.twoFaService.verifyToken(req.user.wallet, body.token);
    
    if (!verified) {
      throw new HttpException('Invalid code', HttpStatus.UNAUTHORIZED);
    }

    return ApiResponse.success({ valid: true });
  }

  /**
   * Disable 2FA
   * DELETE /api/2fa/disable
   * Rate limited: 3 attempts per minute
   */
  @Delete('disable')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable(
    @Req() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) {
      throw new HttpException(
        'Verification token required to disable 2FA',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = await this.twoFaService.disable(req.user.wallet, body.token);
    
    if (!success) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return ApiResponse.success({ disabled: true }, '2FA disabled successfully');
  }

  /**
   * Regenerate recovery codes
   * POST /api/2fa/recovery-codes
   */
  @Post('recovery-codes')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Regenerate recovery codes' })
  async regenerateRecoveryCodes(
    @Req() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) {
      throw new HttpException(
        'Verification token required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const codes = await this.twoFaService.regenerateRecoveryCodes(
      req.user.wallet,
      body.token,
    );
    
    if (!codes) {
      throw new HttpException('Invalid verification code', HttpStatus.UNAUTHORIZED);
    }

    return ApiResponse.success(
      { recoveryCodes: codes },
      'New recovery codes generated. Save them in a safe place!',
    );
  }
}
