import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// ABI for ArenaCore contract
const ARENA_CORE_ABI = [
  // Events
  "event MarketCreated(uint256 indexed marketId, uint256 indexed externalMarketId, uint64 closeTime, uint8 outcomeCount)",
  "event PositionMinted(uint256 indexed tokenId, uint256 indexed marketId, address indexed user, uint8 outcome, uint256 stake, uint256 shares)",
  "event MarketLocked(uint256 indexed marketId)",
  "event MarketResolved(uint256 indexed marketId, uint8 winningOutcome)",
  "event MarketCancelled(uint256 indexed marketId)",
  "event PositionClaimed(uint256 indexed tokenId, address indexed user, uint256 payout)",
  "event PositionRefunded(uint256 indexed tokenId, address indexed user, uint256 refund)",
  
  // Market functions
  "function createMarket(uint256 externalMarketId, uint64 closeTime, uint8 outcomeCount) external returns (uint256)",
  "function lockMarket(uint256 marketId) external",
  "function resolveMarket(uint256 marketId, uint8 winningOutcome) external",
  "function cancelMarket(uint256 marketId) external",
  "function placeBet(uint256 marketId, uint8 outcomeId, uint256 amount, uint256 shares) external returns (uint256)",
  "function claim(uint256 tokenId) external",
  "function refund(uint256 tokenId) external",
  
  // View functions
  "function getMarket(uint256 marketId) external view returns (tuple(uint256 externalMarketId, uint64 closeTime, uint8 outcomeCount, uint8 winningOutcome, uint8 status, uint256 totalStaked, uint256 totalShares, uint256 createdAt))",
  "function getOutcomeData(uint256 marketId, uint8 outcomeId) external view returns (tuple(uint256 totalStaked, uint256 totalShares))",
  "function calculatePayout(uint256 tokenId) external view returns (uint256)",
  "function marketIdCounter() external view returns (uint256)",
  "function treasury() external view returns (address)",
  "function platformFeeBps() external view returns (uint256)",
  
  // Role functions
  "function OPERATOR_ROLE() external view returns (bytes32)",
  "function RESOLVER_ROLE() external view returns (bytes32)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
];

// ABI for ArenaPositionNFT contract
const ARENA_POSITION_NFT_ABI = [
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event PositionCreated(uint256 indexed tokenId, uint256 indexed marketId, address indexed owner, uint8 outcomeId, uint256 stake, uint256 shares)",
  "event PositionClaimed(uint256 indexed tokenId, address indexed owner)",
  "event PositionRefunded(uint256 indexed tokenId, address indexed owner)",
  
  // Position functions
  "function getPosition(uint256 tokenId) external view returns (tuple(uint256 marketId, uint8 outcomeId, uint256 stake, uint256 shares, uint256 timestamp, bool claimed, bool refunded))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokensOfOwner(address owner) external view returns (uint256[])",
  "function getPositionsByMarket(address owner, uint256 marketId) external view returns (uint256[])",
  "function currentTokenId() external view returns (uint256)",
];

// ABI for USDT contract
const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

export interface ChainMarketData {
  externalMarketId: string;
  closeTime: number;
  outcomeCount: number;
  winningOutcome: number;
  status: number;
  totalStaked: string;
  totalShares: string;
  createdAt: number;
}

export interface ChainPositionData {
  marketId: string;
  outcomeId: number;
  stake: string;
  shares: string;
  timestamp: number;
  claimed: boolean;
  refunded: boolean;
}

@Injectable()
export class Web3Service implements OnModuleInit {
  private readonly logger = new Logger(Web3Service.name);
  private provider: ethers.JsonRpcProvider;
  private coreContract: ethers.Contract | null = null;
  private nftContract: ethers.Contract | null = null;
  private usdtContract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  
  private chainId: number;
  private coreAddress: string;
  private nftAddress: string;
  private usdtAddress: string;
  private rpcUrl: string;
  private onchainEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.rpcUrl = process.env.RPC_URL || this.configService.get<string>('chain.rpc') || 'https://bsc-testnet.publicnode.com';
    this.chainId = parseInt(process.env.CHAIN_ID || '97');
    this.coreAddress = process.env.ARENA_CORE_ADDRESS || '';
    this.nftAddress = process.env.ARENA_POSITION_NFT_ADDRESS || '';
    this.usdtAddress = process.env.USDT_ADDRESS || '';
    this.onchainEnabled = process.env.ARENA_ONCHAIN_ENABLED === 'true';
  }

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    
    if (this.coreAddress) {
      this.coreContract = new ethers.Contract(
        this.coreAddress,
        ARENA_CORE_ABI,
        this.provider
      );
      this.logger.log(`Web3 connected to ArenaCore: ${this.coreAddress}`);
    } else {
      this.logger.warn('No contract address configured');
    }

    if (this.nftAddress) {
      this.nftContract = new ethers.Contract(
        this.nftAddress,
        ARENA_POSITION_NFT_ABI,
        this.provider
      );
      this.logger.log(`Web3 connected to ArenaPositionNFT: ${this.nftAddress}`);
    }

    if (this.usdtAddress) {
      this.usdtContract = new ethers.Contract(
        this.usdtAddress,
        USDT_ABI,
        this.provider
      );
    }

    // Initialize wallet if private key is provided
    const privateKey = process.env.OPERATOR_PRIVATE_KEY;
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.logger.log(`Operator wallet configured: ${this.wallet.address}`);
    }
  }

  isOnchainEnabled(): boolean {
    return this.onchainEnabled;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getCoreContract(): ethers.Contract | null {
    return this.coreContract;
  }

  getNftContract(): ethers.Contract | null {
    return this.nftContract;
  }

  getChainId(): number {
    return this.chainId;
  }

  getContractAddress(): string {
    return this.coreAddress;
  }

  getNftAddress(): string {
    return this.nftAddress;
  }

  /**
   * Get signed ArenaCore contract for write operations
   */
  getSignedCoreContract(): ethers.Contract {
    if (!this.wallet) {
      throw new Error('No wallet configured for signing transactions');
    }
    if (!this.coreAddress) {
      throw new Error('No ArenaCore contract address configured');
    }
    return new ethers.Contract(
      this.coreAddress,
      ARENA_CORE_ABI,
      this.wallet
    );
  }

  /**
   * Create market on-chain
   */
  async createMarketOnChain(
    externalMarketId: string,
    closeTime: number,
    outcomeCount: number = 2
  ): Promise<{ marketId: string; txHash: string }> {
    const signedContract = this.getSignedCoreContract();
    
    this.logger.log(`Creating market on-chain: externalId=${externalMarketId}, closeTime=${closeTime}`);
    
    const tx = await signedContract.createMarket(
      BigInt(externalMarketId),
      closeTime,
      outcomeCount
    );
    const receipt = await tx.wait();
    
    // Parse MarketCreated event
    let marketId = '0';
    for (const log of receipt.logs) {
      try {
        const parsed = signedContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'MarketCreated') {
          marketId = parsed.args.marketId.toString();
          this.logger.log(`Market created on-chain: marketId=${marketId}`);
          break;
        }
      } catch {
        continue;
      }
    }

    return {
      marketId,
      txHash: receipt.hash,
    };
  }

  /**
   * Lock market on-chain
   */
  async lockMarketOnChain(marketId: number): Promise<string> {
    const signedContract = this.getSignedCoreContract();
    this.logger.log(`Locking market on-chain: ${marketId}`);
    
    const tx = await signedContract.lockMarket(marketId);
    const receipt = await tx.wait();
    
    this.logger.log(`Market locked: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Resolve market on-chain
   */
  async resolveMarketOnChain(marketId: number, winningOutcome: number): Promise<string> {
    const signedContract = this.getSignedCoreContract();
    this.logger.log(`Resolving market on-chain: ${marketId}, outcome=${winningOutcome}`);
    
    const tx = await signedContract.resolveMarket(marketId, winningOutcome);
    const receipt = await tx.wait();
    
    this.logger.log(`Market resolved: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Cancel market on-chain
   */
  async cancelMarketOnChain(marketId: number): Promise<string> {
    const signedContract = this.getSignedCoreContract();
    this.logger.log(`Cancelling market on-chain: ${marketId}`);
    
    const tx = await signedContract.cancelMarket(marketId);
    const receipt = await tx.wait();
    
    this.logger.log(`Market cancelled: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Get market details from chain
   */
  async getMarketFromChain(marketId: number): Promise<ChainMarketData | null> {
    if (!this.coreContract) return null;
    
    try {
      const result = await this.coreContract.getMarket(marketId);
      
      return {
        externalMarketId: result.externalMarketId.toString(),
        closeTime: Number(result.closeTime),
        outcomeCount: Number(result.outcomeCount),
        winningOutcome: Number(result.winningOutcome),
        status: Number(result.status),
        totalStaked: result.totalStaked.toString(),
        totalShares: result.totalShares.toString(),
        createdAt: Number(result.createdAt),
      };
    } catch (error) {
      this.logger.error(`Error getting market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get position (NFT) details from chain
   */
  async getPositionFromChain(tokenId: number): Promise<ChainPositionData | null> {
    if (!this.nftContract) return null;
    
    try {
      const result = await this.nftContract.getPosition(tokenId);
      
      return {
        marketId: result.marketId.toString(),
        outcomeId: Number(result.outcomeId),
        stake: result.stake.toString(),
        shares: result.shares.toString(),
        timestamp: Number(result.timestamp),
        claimed: result.claimed,
        refunded: result.refunded,
      };
    } catch (error) {
      this.logger.error(`Error getting position ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Get outcome data from chain
   */
  async getOutcomeData(marketId: number, outcomeId: number): Promise<{ totalStaked: string; totalShares: string } | null> {
    if (!this.coreContract) return null;
    
    try {
      const data = await this.coreContract.getOutcomeData(marketId, outcomeId);
      return {
        totalStaked: data.totalStaked.toString(),
        totalShares: data.totalShares.toString(),
      };
    } catch (error) {
      this.logger.error(`Error getting outcome data:`, error);
      return null;
    }
  }

  /**
   * Get NFT owner
   */
  async getPositionOwner(tokenId: number): Promise<string | null> {
    if (!this.nftContract) return null;
    
    try {
      return await this.nftContract.ownerOf(tokenId);
    } catch {
      return null;
    }
  }

  /**
   * Get all positions owned by wallet
   */
  async getPositionsByOwner(wallet: string): Promise<number[]> {
    if (!this.nftContract) return [];
    
    try {
      const tokens = await this.nftContract.tokensOfOwner(wallet);
      return tokens.map((t: bigint) => Number(t));
    } catch {
      return [];
    }
  }

  /**
   * Get market count
   */
  async getMarketCount(): Promise<number> {
    if (!this.coreContract) return 0;
    const count = await this.coreContract.marketIdCounter();
    return Number(count);
  }

  /**
   * Get total NFT count
   */
  async getTokenCount(): Promise<number> {
    if (!this.nftContract) return 0;
    const count = await this.nftContract.currentTokenId();
    return Number(count);
  }

  /**
   * Calculate payout for a position
   */
  async calculatePayout(tokenId: number): Promise<string> {
    if (!this.coreContract) return '0';
    
    try {
      const payout = await this.coreContract.calculatePayout(tokenId);
      return payout.toString();
    } catch {
      return '0';
    }
  }

  /**
   * Get USDT balance for wallet
   */
  async getUsdtBalance(wallet: string): Promise<string> {
    if (!this.usdtContract) return '0';
    
    try {
      const balance = await this.usdtContract.balanceOf(wallet);
      return balance.toString();
    } catch {
      return '0';
    }
  }
}
