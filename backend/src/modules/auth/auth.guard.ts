import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'arena-secret';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Try to get token from Authorization header
    const authHeader = request.headers.authorization;
    
    // Also check x-wallet-address header (for backwards compatibility)
    const walletHeader = request.headers['x-wallet-address'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      // First try to verify as demo token
      try {
        const demoPayload = jwt.verify(token, this.jwtSecret) as any;
        if (demoPayload.isDemo && demoPayload.wallet) {
          // Demo user - allow access with demo wallet
          request.user = {
            id: demoPayload.wallet,
            wallet: demoPayload.wallet,
            username: `Demo_${demoPayload.wallet.slice(6, 12)}`,
            isDemo: true,
          };
          return true;
        }
      } catch {
        // Not a demo token, try regular JWT
      }
      
      // Try regular JWT
      const payload = this.authService.verifyJWT(token);
      
      if (payload) {
        const user = await this.usersService.findByWallet(payload.wallet);
        if (user) {
          request.user = {
            id: (user as any)._id.toString(),
            wallet: user.wallet,
            username: user.username,
          };
          return true;
        }
      }
    }

    // Fallback to x-wallet-address header
    if (walletHeader) {
      let user = await this.usersService.findByWallet(walletHeader);
      
      if (!user) {
        // Auto-create user for backwards compatibility
        user = await this.usersService.getOrCreateUser({ wallet: walletHeader });
      }
      
      request.user = {
        id: (user as any)._id.toString(),
        wallet: user.wallet,
        username: user.username,
      };
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }
}

/**
 * Optional Auth Guard - doesn't throw if no auth, just sets user if present
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const authHeader = request.headers.authorization;
    const walletHeader = request.headers['x-wallet-address'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = this.authService.verifyJWT(token);
      
      if (payload) {
        const user = await this.usersService.findByWallet(payload.wallet);
        if (user) {
          request.user = {
            id: (user as any)._id.toString(),
            wallet: user.wallet,
            username: user.username,
          };
        }
      }
    } else if (walletHeader) {
      const user = await this.usersService.findByWallet(walletHeader);
      if (user) {
        request.user = {
          id: (user as any)._id.toString(),
          wallet: user.wallet,
          username: user.username,
        };
      }
    }

    return true;
  }
}
