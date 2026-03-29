import { Module } from '@nestjs/common';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramAuthService } from './telegram-auth.service';

@Module({
  controllers: [TelegramAuthController],
  providers: [TelegramAuthService],
  exports: [TelegramAuthService],
})
export class TelegramAuthModule {}
