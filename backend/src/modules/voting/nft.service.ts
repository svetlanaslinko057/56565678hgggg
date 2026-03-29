import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ethers } from 'ethers';

/**
 * NFT Service - Real NFT Eligibility Check (Production Ready)
 * 
 * Voting eligibility requires REAL ownership:
 * 1. On-chain NFT balance via ArenaCore/Position NFT contract
 * 2. OR database positions (open/won status) - proves participation
 * 
 * NO MOCK MODE - fail secure by default.
 * 
 * Production Notes:
 * - Cache TTL: 5 minutes for RPC calls
 * - DB positions checked without cache (real-time)
 * - Fail secure: deny if all checks fail
 */
@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);

  private provider: ethers.JsonRpcProvider;
  private arenaCoreContract: ethers.Contract | null = null;
  private positionNFTContract: ethers.Contract | null = null;

  // Cache for on-chain NFT balances (wallet -> { hasNFT, balance, timestamp })
  private cache = new Map<string, { hasNFT: boolean; balance: number; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ERC721 ABI for balanceOf
  private readonly ERC721_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  ];

  // ArenaCore ABI - includes position tracking and NFT
  private readonly ARENA_CORE_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function getPositionCount(address owner) view returns (uint256)',
    'function hasActivePosition(address owner) view returns (bool)',
    'function positionCount(address) view returns (uint256)',
  ];

  constructor(
    @InjectConnection() private connection: Connection,
  ) {
    const rpcUrl = process.env.CHAIN_RPC || 'https://bsc-testnet.publicnode.com';
    const arenaCoreAddress = process.env.ARENA_CORE_ADDRESS || process.env.PREDICTION_CONTRACT;
    const positionNFTAddress = process.env.POSITION_NFT_ADDRESS;

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      if (arenaCoreAddress) {
        this.arenaCoreContract = new ethers.Contract(
          arenaCoreAddress,
          this.ARENA_CORE_ABI,
          this.provider
        );
        this.logger.log(`NFTService initialized with ArenaCore: ${arenaCoreAddress}`);
      }

      if (positionNFTAddress) {
        this.positionNFTContract = new ethers.Contract(
          positionNFTAddress,
          this.ERC721_ABI,
          this.provider
        );
        this.logger.log(`NFTService initialized with Position NFT: ${positionNFTAddress}`);
      }
      
      this.logger.log(`NFTService ready - RPC: ${rpcUrl}`);
    } catch (error) {
      this.logger.error(`NFTService initialization failed: ${error.message}`);
    }
  }

  /**
   * Get positions collection
   */
  private get positionsCollection() {
    return this.connection.collection('positions');
  }

  /**
   * Check if wallet has NFT/Position for voting eligibility
   * 
   * REAL CHECK - NO MOCKS:
   * 1. Check database positions (open/won/listed) - proves platform participation
   * 2. Check on-chain ArenaCore contract balanceOf
   * 3. Check on-chain Position NFT contract
   * 
   * Returns true if ANY of the above is true.
   * Fail secure: returns false on all errors.
   */
  async hasNFT(wallet: string): Promise<boolean> {
    const normalizedWallet = wallet.toLowerCase();

    // Check RPC cache first (for on-chain checks)
    const cached = this.cache.get(normalizedWallet);
    const isCacheValid = cached && Date.now() - cached.timestamp < this.CACHE_TTL;

    let hasNFT = false;
    let onChainBalance = 0;
    let dbPositionCount = 0;

    try {
      // METHOD 1: Check database positions (most reliable, real-time)
      // User who has made bets on the platform = eligible
      try {
        dbPositionCount = await this.positionsCollection.countDocuments({
          wallet: normalizedWallet,
          status: { $in: ['open', 'won', 'listed'] }, // Active positions
        });
        
        if (dbPositionCount > 0) {
          hasNFT = true;
          this.logger.debug(`Wallet ${normalizedWallet} has ${dbPositionCount} DB positions`);
        }
      } catch (dbError) {
        this.logger.warn(`DB position check failed: ${dbError.message}`);
      }

      // METHOD 2: Check on-chain ArenaCore (if DB check failed)
      if (!hasNFT && this.arenaCoreContract) {
        // Use cache for RPC calls if available
        if (isCacheValid) {
          hasNFT = cached.hasNFT;
          onChainBalance = cached.balance;
        } else {
          try {
            // Try balanceOf first (standard ERC721)
            const balance = await this.arenaCoreContract.balanceOf(normalizedWallet);
            onChainBalance = Number(balance);
            if (onChainBalance > 0) {
              hasNFT = true;
              this.logger.debug(`Wallet ${normalizedWallet} has ${onChainBalance} on-chain positions`);
            }
          } catch (e) {
            // Contract might not have balanceOf, try alternatives
            try {
              const count = await this.arenaCoreContract.positionCount(normalizedWallet);
              onChainBalance = Number(count);
              if (onChainBalance > 0) {
                hasNFT = true;
              }
            } catch {
              try {
                const hasActive = await this.arenaCoreContract.hasActivePosition(normalizedWallet);
                if (hasActive) {
                  hasNFT = true;
                  onChainBalance = 1;
                }
              } catch {
                // All methods failed, continue
                this.logger.warn(`ArenaCore check failed for ${normalizedWallet}`);
              }
            }
          }
        }
      }

      // METHOD 3: Check dedicated Position NFT contract
      if (!hasNFT && this.positionNFTContract && !isCacheValid) {
        try {
          const nftBalance = await this.positionNFTContract.balanceOf(normalizedWallet);
          if (Number(nftBalance) > 0) {
            hasNFT = true;
            onChainBalance += Number(nftBalance);
            this.logger.debug(`Wallet ${normalizedWallet} has ${nftBalance} Position NFTs`);
          }
        } catch (e) {
          this.logger.warn(`Position NFT check failed: ${e.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`NFT check failed for ${normalizedWallet}: ${error.message}`);
      // Fail secure - deny voting if all checks fail
      hasNFT = false;
    }

    // Update cache for on-chain results
    if (!isCacheValid) {
      this.cache.set(normalizedWallet, { 
        hasNFT, 
        balance: onChainBalance, 
        timestamp: Date.now() 
      });
    }

    this.logger.log(`NFT check: ${normalizedWallet} = ${hasNFT} (DB: ${dbPositionCount}, On-chain: ${onChainBalance})`);
    return hasNFT;
  }

  /**
   * Get NFT/Position balance for wallet
   * Returns combined count of DB positions + on-chain NFTs
   */
  async getBalance(wallet: string): Promise<number> {
    const normalizedWallet = wallet.toLowerCase();
    let totalBalance = 0;

    try {
      // Count DB positions
      const dbCount = await this.positionsCollection.countDocuments({
        wallet: normalizedWallet,
        status: { $in: ['open', 'won', 'listed'] },
      });
      totalBalance += dbCount;

      // Check on-chain
      if (this.arenaCoreContract) {
        try {
          const balance = await this.arenaCoreContract.balanceOf(normalizedWallet);
          totalBalance += Number(balance);
        } catch {
          // Ignore errors
        }
      }

      if (this.positionNFTContract) {
        try {
          const balance = await this.positionNFTContract.balanceOf(normalizedWallet);
          totalBalance += Number(balance);
        } catch {
          // Ignore errors
        }
      }
    } catch (error) {
      this.logger.error(`getBalance failed for ${normalizedWallet}: ${error.message}`);
    }

    return totalBalance;
  }

  /**
   * Get detailed eligibility info for wallet
   */
  async getEligibilityDetails(wallet: string): Promise<{
    eligible: boolean;
    dbPositions: number;
    onChainBalance: number;
    cached: boolean;
  }> {
    const normalizedWallet = wallet.toLowerCase();
    
    // Get DB positions
    const dbPositions = await this.positionsCollection.countDocuments({
      wallet: normalizedWallet,
      status: { $in: ['open', 'won', 'listed'] },
    });

    // Check cache
    const cached = this.cache.get(normalizedWallet);
    const isCacheValid = cached && Date.now() - cached.timestamp < this.CACHE_TTL;

    const eligible = await this.hasNFT(normalizedWallet);

    return {
      eligible,
      dbPositions,
      onChainBalance: cached?.balance || 0,
      cached: isCacheValid,
    };
  }

  /**
   * Clear cache for specific wallet (useful after position changes)
   */
  clearCache(wallet?: string): void {
    if (wallet) {
      this.cache.delete(wallet.toLowerCase());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }
}
