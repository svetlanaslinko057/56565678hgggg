import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { LedgerEntry, LedgerType } from '../ledger/ledger.schema';
import { Position, PositionStatus } from '../positions/positions.schema';

export interface WalletBalance {
  wallet: string;
  // Demo/Platform balance
  balanceUsdt: number;
  // On-chain balance (when enabled)
  usdtOnChain: string | null;
  // Position stats
  openPositions: number;
  totalPositions: number;
  // P&L
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  unrealizedPnl: number;
  realizedPnl: number;
  // Mode
  isOnChainEnabled: boolean;
}

export interface WalletStats {
  wallet: string;
  totalBets: number;
  winRate: number;
  avgOdds: number;
  bestWin: number;
  worstLoss: number;
  roi: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly isOnChainEnabled: boolean;

  constructor(
    @InjectModel('LedgerEntry') private ledgerModel: Model<LedgerEntry>,
    @InjectModel('Position') private positionModel: Model<Position>,
    private configService: ConfigService,
  ) {
    this.isOnChainEnabled = this.configService.get<string>('ARENA_ONCHAIN_ENABLED') === 'true';
  }

  /**
   * Get comprehensive wallet balance
   */
  async getBalance(wallet: string): Promise<WalletBalance> {
    const walletLower = wallet.toLowerCase();

    // Get ledger balance (demo/platform)
    const ledgerAgg = await this.ledgerModel.aggregate([
      { $match: { wallet: walletLower } },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amount' },
        },
      },
    ]);
    const balanceUsdt = ledgerAgg.length ? ledgerAgg[0].balance : 0;

    // Get position counts
    const [openPositions, totalPositions] = await Promise.all([
      this.positionModel.countDocuments({ wallet: walletLower, status: PositionStatus.OPEN }),
      this.positionModel.countDocuments({ wallet: walletLower }),
    ]);

    // Get staking stats
    const stakingAgg = await this.positionModel.aggregate([
      { $match: { wallet: walletLower } },
      {
        $group: {
          _id: null,
          totalStaked: { $sum: '$stake' },
          totalPotential: { $sum: '$potentialReturn' },
        },
      },
    ]);
    const totalStaked = stakingAgg.length ? stakingAgg[0].totalStaked : 0;

    // Get P&L from resolved positions
    const pnlAgg = await this.positionModel.aggregate([
      { 
        $match: { 
          wallet: walletLower,
          status: { $in: [PositionStatus.WON, PositionStatus.LOST, PositionStatus.CLAIMED] }
        }
      },
      {
        $group: {
          _id: null,
          totalWon: {
            $sum: {
              $cond: [{ $in: ['$status', [PositionStatus.WON, PositionStatus.CLAIMED]] }, '$profit', 0]
            }
          },
          totalLost: {
            $sum: {
              $cond: [{ $eq: ['$status', PositionStatus.LOST] }, { $abs: '$profit' }, 0]
            }
          },
        },
      },
    ]);
    const totalWon = pnlAgg.length ? pnlAgg[0].totalWon : 0;
    const totalLost = pnlAgg.length ? pnlAgg[0].totalLost : 0;

    // Calculate unrealized P&L from open positions
    const openAgg = await this.positionModel.aggregate([
      { $match: { wallet: walletLower, status: PositionStatus.OPEN } },
      {
        $group: {
          _id: null,
          unrealized: { $sum: { $subtract: ['$potentialReturn', '$stake'] } },
        },
      },
    ]);
    const unrealizedPnl = openAgg.length ? openAgg[0].unrealized : 0;

    // On-chain balance (future)
    let usdtOnChain: string | null = null;
    if (this.isOnChainEnabled) {
      // TODO: Call USDT contract balanceOf(wallet)
      // const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
      // usdtOnChain = ethers.formatUnits(await usdtContract.balanceOf(wallet), 6);
      usdtOnChain = '0.00';
    }

    return {
      wallet: walletLower,
      balanceUsdt,
      usdtOnChain,
      openPositions,
      totalPositions,
      totalStaked,
      totalWon,
      totalLost,
      unrealizedPnl,
      realizedPnl: totalWon - totalLost,
      isOnChainEnabled: this.isOnChainEnabled,
    };
  }

  /**
   * Get wallet positions
   */
  async getPositions(wallet: string, status?: string, limit: number = 50) {
    const walletLower = wallet.toLowerCase();
    
    const query: any = { wallet: walletLower };
    if (status) {
      query.status = status;
    }

    const positions = await this.positionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      positions,
      total: await this.positionModel.countDocuments(query),
    };
  }

  /**
   * Get wallet NFTs (position NFTs)
   */
  async getNFTs(wallet: string) {
    const walletLower = wallet.toLowerCase();

    // Get positions with NFT data
    const nftPositions = await this.positionModel
      .find({
        wallet: walletLower,
        'nft.tokenId': { $exists: true, $ne: null },
        status: { $in: [PositionStatus.OPEN, PositionStatus.LISTED] },
      })
      .select('marketId outcomeLabel stake odds potentialReturn nft status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return {
      nfts: nftPositions.map(p => ({
        tokenId: p.nft?.tokenId,
        contract: p.nft?.contract,
        chainId: p.nft?.chainId,
        marketId: p.marketId,
        outcomeLabel: p.outcomeLabel,
        stake: p.stake,
        odds: p.odds,
        potentialReturn: p.potentialReturn,
        status: p.status,
        createdAt: (p as any).createdAt,
      })),
      total: nftPositions.length,
    };
  }

  /**
   * Get wallet transaction history
   */
  async getHistory(wallet: string, type?: string, limit: number = 50) {
    const walletLower = wallet.toLowerCase();

    const query: any = { wallet: walletLower };
    if (type) {
      query.type = type;
    }

    const history = await this.ledgerModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      transactions: history,
      total: await this.ledgerModel.countDocuments(query),
    };
  }

  /**
   * Get wallet stats
   */
  async getStats(wallet: string): Promise<WalletStats> {
    const walletLower = wallet.toLowerCase();

    // Get all resolved positions
    const positions = await this.positionModel
      .find({
        wallet: walletLower,
        status: { $in: [PositionStatus.WON, PositionStatus.LOST, PositionStatus.CLAIMED] },
      })
      .lean();

    const totalBets = positions.length;
    const wins = positions.filter(p => 
      p.status === PositionStatus.WON || p.status === PositionStatus.CLAIMED
    ).length;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    const avgOdds = totalBets > 0 
      ? positions.reduce((sum, p) => sum + p.odds, 0) / totalBets 
      : 0;

    const profits = positions.map(p => p.profit || 0);
    const bestWin = Math.max(0, ...profits);
    const worstLoss = Math.min(0, ...profits);

    const totalStaked = positions.reduce((sum, p) => sum + p.stake, 0);
    const totalProfit = profits.reduce((sum, p) => sum + p, 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    return {
      wallet: walletLower,
      totalBets,
      winRate: Math.round(winRate * 100) / 100,
      avgOdds: Math.round(avgOdds * 100) / 100,
      bestWin,
      worstLoss,
      roi: Math.round(roi * 100) / 100,
    };
  }
}
