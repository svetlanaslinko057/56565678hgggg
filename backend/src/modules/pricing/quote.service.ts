import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

/**
 * Quote Service
 * 
 * Generates signed quotes for betting with LMSR pricing.
 * The quote is signed using EIP-712 and validated by the smart contract.
 * 
 * Flow:
 * 1. Frontend requests quote: POST /pricing/quote
 * 2. Backend calculates LMSR price and returns signed quote
 * 3. Frontend submits quote to contract: placeBetWithQuote()
 * 4. Contract validates signature and processes bet
 */
@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);
  private signer: ethers.Wallet | null = null;
  private domain: ethers.TypedDataDomain | null = null;

  // EIP-712 type definition (must match contract)
  private readonly BET_QUOTE_TYPES = {
    BetQuote: [
      { name: 'user', type: 'address' },
      { name: 'marketId', type: 'uint256' },
      { name: 'outcomeId', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'entryPriceE18', type: 'uint256' },
      { name: 'deadline', type: 'uint64' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  constructor() {
    this.initializeSigner();
  }

  /**
   * Initialize the signer for quote signing
   */
  private initializeSigner() {
    const quoterPrivateKey = process.env.QUOTER_PRIVATE_KEY;
    const arenaCoreAddress = process.env.ARENA_CORE_ADDRESS;
    const chainId = parseInt(process.env.CHAIN_ID || '97');

    if (!quoterPrivateKey) {
      this.logger.warn('QUOTER_PRIVATE_KEY not set - quote signing disabled');
      return;
    }

    if (!arenaCoreAddress) {
      this.logger.warn('ARENA_CORE_ADDRESS not set - quote signing disabled');
      return;
    }

    try {
      this.signer = new ethers.Wallet(quoterPrivateKey);
      
      // EIP-712 domain (must match contract constructor)
      this.domain = {
        name: 'ArenaCore',
        version: '1',
        chainId,
        verifyingContract: arenaCoreAddress,
      };

      this.logger.log(`Quote signer initialized: ${this.signer.address}`);
    } catch (error) {
      this.logger.error('Failed to initialize quote signer', error);
    }
  }

  /**
   * Check if quote signing is available
   */
  isAvailable(): boolean {
    return this.signer !== null && this.domain !== null;
  }

  /**
   * Generate a signed bet quote
   */
  async generateQuote(params: {
    user: string;
    marketId: string | number;
    outcomeId: number;
    amount: string; // Amount in wei (USDT with 18 decimals)
    shares: string; // Shares calculated by LMSR
    entryPriceE18: string; // Entry price with 18 decimals
    deadlineSeconds?: number; // Quote validity in seconds (default: 5 minutes)
  }): Promise<{
    quote: {
      user: string;
      marketId: string;
      outcomeId: number;
      amount: string;
      shares: string;
      entryPriceE18: string;
      deadline: string;
      nonce: string;
    };
    signature: string;
    expiresAt: Date;
  } | null> {
    if (!this.signer || !this.domain) {
      this.logger.warn('Quote signing not available');
      return null;
    }

    const deadlineSeconds = params.deadlineSeconds || 300; // 5 minutes default
    const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;
    const nonce = BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000));

    const quote = {
      user: params.user,
      marketId: BigInt(params.marketId),
      outcomeId: params.outcomeId,
      amount: BigInt(params.amount),
      shares: BigInt(params.shares),
      entryPriceE18: BigInt(params.entryPriceE18),
      deadline: BigInt(deadline),
      nonce,
    };

    try {
      // Sign the typed data
      const signature = await this.signer.signTypedData(
        this.domain,
        this.BET_QUOTE_TYPES,
        quote
      );

      this.logger.debug('Quote generated', { 
        user: params.user, 
        marketId: params.marketId,
        amount: params.amount,
      });

      return {
        quote: {
          user: params.user,
          marketId: params.marketId.toString(),
          outcomeId: params.outcomeId,
          amount: params.amount,
          shares: params.shares,
          entryPriceE18: params.entryPriceE18,
          deadline: deadline.toString(),
          nonce: nonce.toString(),
        },
        signature,
        expiresAt: new Date(deadline * 1000),
      };
    } catch (error) {
      this.logger.error('Failed to generate quote', error);
      return null;
    }
  }

  /**
   * Get signer info for debugging
   */
  getSignerInfo(): { address: string; chainId: number; contract: string } | null {
    if (!this.signer || !this.domain) {
      return null;
    }
    return {
      address: this.signer.address,
      chainId: this.domain.chainId as number,
      contract: this.domain.verifyingContract as string,
    };
  }
}
