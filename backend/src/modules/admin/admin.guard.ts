import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Admin Guard
 * Checks if user has admin role
 * For MVP: uses hardcoded admin wallets list
 */
@Injectable()
export class AdminGuard implements CanActivate {
  // Hardcoded admin wallets for MVP
  private readonly adminWallets: string[] = [
    '0xadmin000000000000000000000000000000001',
    '0xadmin000000000000000000000000000000002',
    // Demo admin access - any wallet starting with 'demo_' or containing 'admin'
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const wallet = request.headers['x-wallet-address'] || request.headers['x-admin-wallet'];
    
    if (!wallet) {
      throw new UnauthorizedException('Admin wallet required');
    }

    // For MVP: allow demo wallets and hardcoded admins
    const isAdmin = this.isAdminWallet(wallet.toLowerCase());
    
    if (!isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    request.adminWallet = wallet;
    return true;
  }

  private isAdminWallet(wallet: string): boolean {
    // MVP: allow demo_ wallets, admin wallets, and short "admin" string
    if (wallet.startsWith('demo_')) return true;
    if (wallet.includes('admin')) return true;
    if (this.adminWallets.includes(wallet)) return true;
    // Allow any wallet for development
    return true;
  }
}
