import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { ArenaUser, UserSource } from '../users/users.schema';

interface SessionDto {
  wallet?: string;
  platformUserId?: string;
  telegramId?: string;
  username?: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    wallet: string;
    username: string;
    xp: number;
    tier: string;
    badges: string[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret') || 'arena-secret';
  }

  /**
   * Generate nonce for SIWE
   */
  async generateNonce(wallet: string): Promise<string> {
    return this.usersService.generateNonce(wallet);
  }

  /**
   * Build sign message for SIWE
   */
  buildSignMessage(wallet: string, nonce: string): string {
    return `Sign in to FOMO Arena

Wallet: ${wallet}
Nonce: ${nonce}

This signature proves you own this wallet.`;
  }

  /**
   * Verify EIP-191 signature
   */
  async verifySignature(
    wallet: string,
    message: string,
    signature: string,
  ): Promise<AuthResult | null> {
    try {
      this.logger.log(`Verifying signature for wallet: ${wallet}`);
      this.logger.log(`Message length: ${message.length}`);
      
      // Recover address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      this.logger.log(`Recovered address: ${recoveredAddress}`);
      
      // Check if recovered address matches
      if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
        this.logger.warn(`Signature verification failed: expected ${wallet}, got ${recoveredAddress}`);
        return null;
      }

      // Check nonce (extract from message)
      const storedNonce = await this.usersService.getNonce(wallet);
      this.logger.log(`Stored nonce: ${storedNonce}`);
      
      if (!storedNonce || !message.includes(storedNonce)) {
        this.logger.warn(`Invalid nonce for wallet: ${wallet}. Stored: ${storedNonce}`);
        return null;
      }

      // Get or create user
      const user = await this.usersService.getOrCreateUser({
        wallet,
        source: UserSource.ARENA,
      });

      // Update last login
      await this.usersService.updateLastLogin(wallet);

      // Generate new nonce for next login
      await this.usersService.generateNonce(wallet);

      // Generate JWT
      const token = this.generateJWT(user);

      return {
        token,
        user: {
          id: (user as any)._id.toString(),
          wallet: user.wallet,
          username: user.username,
          xp: user.xp,
          tier: user.tier,
          badges: user.badges,
        },
      };
    } catch (error) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return null;
    }
  }

  /**
   * Create session from external platform (Main/Telegram)
   */
  async createSession(dto: SessionDto): Promise<AuthResult> {
    let user: ArenaUser | null = null;

    // Try to find user by various identifiers
    if (dto.wallet) {
      user = await this.usersService.findByWallet(dto.wallet);
    }
    if (!user && dto.platformUserId) {
      user = await this.usersService.findByPlatformUserId(dto.platformUserId);
    }
    if (!user && dto.telegramId) {
      user = await this.usersService.findByTelegramId(dto.telegramId);
    }

    // Create user if not found
    if (!user) {
      if (!dto.wallet) {
        throw new UnauthorizedException('Wallet address required for new users');
      }
      
      user = await this.usersService.getOrCreateUser({
        wallet: dto.wallet,
        username: dto.username,
        platformUserId: dto.platformUserId,
        telegramId: dto.telegramId,
        source: dto.platformUserId 
          ? UserSource.PLATFORM 
          : dto.telegramId 
            ? UserSource.TELEGRAM 
            : UserSource.ARENA,
      });
    }

    // Update last login
    await this.usersService.updateLastLogin(user.wallet);

    // Generate JWT
    const token = this.generateJWT(user);

    return {
      token,
      user: {
        id: (user as any)._id.toString(),
        wallet: user.wallet,
        username: user.username,
        xp: user.xp,
        tier: user.tier,
        badges: user.badges,
      },
    };
  }

  /**
   * Generate JWT token
   */
  private generateJWT(user: ArenaUser): string {
    const payload = {
      sub: (user as any)._id.toString(),
      wallet: user.wallet,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): { sub: string; wallet: string } | null {
    try {
      return jwt.verify(token, this.jwtSecret) as { sub: string; wallet: string };
    } catch {
      return null;
    }
  }

  /**
   * Get user by wallet
   */
  async getUser(wallet: string): Promise<ArenaUser | null> {
    return this.usersService.findByWallet(wallet);
  }
}
