import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

class NonceDto {
  @IsString()
  @IsNotEmpty()
  wallet: string;
}

class VerifyDto {
  @IsString()
  @IsNotEmpty()
  wallet: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}

class SessionDto {
  @IsString()
  @IsOptional()
  wallet?: string;

  @IsString()
  @IsOptional()
  platformUserId?: string;

  @IsString()
  @IsOptional()
  telegramId?: string;

  @IsString()
  @IsOptional()
  username?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get nonce for wallet signature
   * GET /api/auth/nonce?wallet=0x...
   */
  @Get('nonce')
  async getNonce(@Query('wallet') wallet: string) {
    if (!wallet) {
      throw new UnauthorizedException('Wallet address required');
    }
    
    const nonce = await this.authService.generateNonce(wallet);
    const message = this.authService.buildSignMessage(wallet, nonce);
    
    return ApiResponse.success({ nonce, message });
  }

  /**
   * Verify wallet signature and return JWT
   * POST /api/auth/verify
   */
  @Post('verify')
  async verify(@Body() dto: VerifyDto) {
    const { wallet, message, signature } = dto;
    
    if (!wallet || !message || !signature) {
      return ApiResponse.error('Missing required fields: wallet, message, signature');
    }
    
    const result = await this.authService.verifySignature(wallet, message, signature);
    
    if (!result) {
      return ApiResponse.error('Invalid signature or nonce expired. Please try again.');
    }
    
    return ApiResponse.success(result);
  }

  /**
   * Create session from external platform
   * POST /api/auth/session
   */
  @Post('session')
  async createSession(@Body() dto: SessionDto) {
    const result = await this.authService.createSession(dto);
    return ApiResponse.success(result);
  }

  /**
   * Check if user exists
   * GET /api/auth/check?wallet=0x...
   */
  @Get('check')
  async checkUser(@Query('wallet') wallet: string) {
    const user = await this.authService.getUser(wallet);
    return ApiResponse.success({ exists: !!user, user });
  }
}
