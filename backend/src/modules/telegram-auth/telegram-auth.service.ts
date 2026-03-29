import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export interface TelegramUser {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramPhotoUrl?: string;
  authProvider: 'telegram';
  referredBy?: string;
  wallet?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  private get usersCollection() {
    return this.connection.collection('users');
  }

  /**
   * Parse Telegram initData string into key-value pairs
   */
  private parseInitData(initData: string): Record<string, string> {
    const params = new URLSearchParams(initData);
    const data: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    return data;
  }

  /**
   * Validate Telegram initData signature
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private validateTelegramInitData(initData: string, botToken: string): Record<string, string> {
    const data = this.parseInitData(initData);
    const receivedHash = data.hash;

    if (!receivedHash) {
      throw new UnauthorizedException('Missing Telegram hash');
    }

    // Remove hash from data for verification
    delete data.hash;

    // Create data check string (sorted key=value pairs joined by newline)
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    // Create secret key using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate expected hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== receivedHash) {
      this.logger.warn('Invalid Telegram initData signature');
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    // Check auth_date is not too old (within 24 hours)
    const authDate = parseInt(data.auth_date, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      throw new UnauthorizedException('Telegram auth data expired');
    }

    return data;
  }

  /**
   * Find or create user by Telegram ID
   */
  private async findOrCreateTelegramUser(tgUser: any, referredBy?: string): Promise<TelegramUser> {
    const telegramId = String(tgUser.id);
    
    // Try to find existing user
    let user = await this.usersCollection.findOne({ telegramId });

    if (!user) {
      // Create new user
      const newUser = {
        telegramId,
        telegramUsername: tgUser.username || null,
        telegramFirstName: tgUser.first_name || null,
        telegramPhotoUrl: tgUser.photo_url || null,
        authProvider: 'telegram',
        referredBy: referredBy || null,
        wallet: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.usersCollection.insertOne(newUser);
      
      this.logger.log(`Created new Telegram user: ${telegramId}`);
      
      return {
        id: result.insertedId.toString(),
        ...newUser,
      } as TelegramUser;
    }

    // Update existing user info
    await this.usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          telegramUsername: tgUser.username || user.telegramUsername,
          telegramFirstName: tgUser.first_name || user.telegramFirstName,
          telegramPhotoUrl: tgUser.photo_url || user.telegramPhotoUrl,
          updatedAt: new Date(),
        },
      },
    );

    return {
      id: user._id.toString(),
      telegramId: user.telegramId,
      telegramUsername: tgUser.username || user.telegramUsername,
      telegramFirstName: tgUser.first_name || user.telegramFirstName,
      telegramPhotoUrl: tgUser.photo_url || user.telegramPhotoUrl,
      authProvider: 'telegram',
      referredBy: user.referredBy,
      wallet: user.wallet,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };
  }

  /**
   * Authenticate with Telegram initData
   */
  async loginWithTelegram(initData: string, startParam?: string): Promise<{
    token: string;
    user: TelegramUser;
  }> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // For development/testing, allow bypassing validation
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured, using demo mode');
      
      // Parse initData without validation for demo
      const data = this.parseInitData(initData);
      
      if (!data.user) {
        throw new UnauthorizedException('Telegram user not found in initData');
      }

      const tgUser = JSON.parse(data.user);
      
      // Extract referral from startParam
      const referredBy = startParam?.startsWith('ref_') 
        ? startParam.replace('ref_', '') 
        : undefined;

      const user = await this.findOrCreateTelegramUser(tgUser, referredBy);

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || 'fomo-arena-secret-key-2026';
      const token = jwt.sign(
        {
          sub: user.id,
          telegramId: user.telegramId,
          authProvider: 'telegram',
        },
        jwtSecret,
        { expiresIn: '7d' },
      );

      this.logger.log(`Telegram auth (demo mode): ${user.telegramId}`);

      return { token, user };
    }

    // Production: Validate initData signature
    const validated = this.validateTelegramInitData(initData, botToken);

    if (!validated.user) {
      throw new UnauthorizedException('Telegram user not found in initData');
    }

    const tgUser = JSON.parse(validated.user);

    // Extract referral from startParam
    const referredBy = startParam?.startsWith('ref_') 
      ? startParam.replace('ref_', '') 
      : undefined;

    const user = await this.findOrCreateTelegramUser(tgUser, referredBy);

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fomo-arena-secret-key-2026';
    const token = jwt.sign(
      {
        sub: user.id,
        telegramId: user.telegramId,
        authProvider: 'telegram',
      },
      jwtSecret,
      { expiresIn: '7d' },
    );

    this.logger.log(`Telegram auth successful: ${user.telegramId}`);

    return { token, user };
  }
}
