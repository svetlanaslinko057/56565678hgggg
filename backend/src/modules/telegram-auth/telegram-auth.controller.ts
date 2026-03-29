import { Body, Controller, Post, Logger } from '@nestjs/common';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramAuthService } from './telegram-auth.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('auth/telegram')
export class TelegramAuthController {
  private readonly logger = new Logger(TelegramAuthController.name);

  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  /**
   * Authenticate with Telegram Mini App
   * POST /api/auth/telegram
   */
  @Post()
  async login(@Body() body: TelegramAuthDto) {
    this.logger.log('Telegram auth request received');
    
    const result = await this.telegramAuthService.loginWithTelegram(
      body.initData,
      body.startParam,
    );

    return ApiResponse.success(result, 'Telegram authentication successful');
  }
}
