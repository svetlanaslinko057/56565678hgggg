import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ArenaUser } from '../users/users.schema';

export interface TwoFaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface TwoFaVerifyResponse {
  verified: boolean;
  recoveryCodes?: string[];
}

@Injectable()
export class TwoFaService {
  private readonly logger = new Logger(TwoFaService.name);
  private readonly APP_NAME = 'FOMO Arena';

  constructor(
    @InjectModel('ArenaUser') private userModel: Model<ArenaUser>,
  ) {}

  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(wallet: string): Promise<TwoFaSetupResponse> {
    const walletLower = wallet.toLowerCase();
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${this.APP_NAME}:${walletLower.slice(0, 10)}`,
      issuer: this.APP_NAME,
    });

    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not enabled yet until verified)
    await this.userModel.findOneAndUpdate(
      { wallet: walletLower },
      { 
        $set: { 
          'security.twoFactorSecret': secret.base32,
          'security.twoFactorEnabled': false,
          'security.twoFactorMethod': null,
        }
      },
      { upsert: true },
    );

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url!,
      qrCodeDataUrl,
    };
  }

  /**
   * Verify TOTP code and enable 2FA if valid
   */
  async verifyAndEnable(wallet: string, token: string): Promise<TwoFaVerifyResponse> {
    const walletLower = wallet.toLowerCase();
    
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    if (!user) {
      return { verified: false };
    }

    const secret = (user as any).security?.twoFactorSecret;
    if (!secret) {
      return { verified: false };
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step tolerance (30 seconds before/after)
    });

    if (!verified) {
      return { verified: false };
    }

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    // Enable 2FA
    await this.userModel.findOneAndUpdate(
      { wallet: walletLower },
      { 
        $set: { 
          'security.twoFactorEnabled': true,
          'security.twoFactorMethod': 'app',
          'security.recoveryCodes': recoveryCodes,
          'security.twoFactorEnabledAt': new Date(),
        }
      },
    );

    this.logger.log(`2FA enabled for wallet: ${walletLower.slice(0, 10)}...`);

    return {
      verified: true,
      recoveryCodes,
    };
  }

  /**
   * Verify TOTP code for login
   */
  async verifyToken(wallet: string, token: string): Promise<boolean> {
    const walletLower = wallet.toLowerCase();
    
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    if (!user) {
      return false;
    }

    const security = (user as any).security;
    if (!security?.twoFactorEnabled || !security?.twoFactorSecret) {
      return true; // 2FA not enabled, allow
    }

    // Check if it's a recovery code
    if (token.length === 10 && security.recoveryCodes?.includes(token)) {
      // Remove used recovery code
      await this.userModel.findOneAndUpdate(
        { wallet: walletLower },
        { $pull: { 'security.recoveryCodes': token } },
      );
      this.logger.log(`Recovery code used for wallet: ${walletLower.slice(0, 10)}...`);
      return true;
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: security.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    return verified;
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async isEnabled(wallet: string): Promise<boolean> {
    const walletLower = wallet.toLowerCase();
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    return !!(user as any)?.security?.twoFactorEnabled;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(wallet: string, token: string): Promise<boolean> {
    const walletLower = wallet.toLowerCase();
    
    // First verify the token
    const verified = await this.verifyToken(walletLower, token);
    if (!verified) {
      return false;
    }

    // Disable 2FA
    await this.userModel.findOneAndUpdate(
      { wallet: walletLower },
      { 
        $set: { 
          'security.twoFactorEnabled': false,
          'security.twoFactorMethod': null,
          'security.twoFactorSecret': null,
          'security.recoveryCodes': [],
        }
      },
    );

    this.logger.log(`2FA disabled for wallet: ${walletLower.slice(0, 10)}...`);
    return true;
  }

  /**
   * Regenerate recovery codes
   */
  async regenerateRecoveryCodes(wallet: string, token: string): Promise<string[] | null> {
    const walletLower = wallet.toLowerCase();
    
    // Verify token first
    const verified = await this.verifyToken(walletLower, token);
    if (!verified) {
      return null;
    }

    const recoveryCodes = this.generateRecoveryCodes();

    await this.userModel.findOneAndUpdate(
      { wallet: walletLower },
      { $set: { 'security.recoveryCodes': recoveryCodes } },
    );

    return recoveryCodes;
  }

  /**
   * Generate random recovery codes
   */
  private generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 10; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    
    return codes;
  }
}
