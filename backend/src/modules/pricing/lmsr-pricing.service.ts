import { Injectable, Logger } from '@nestjs/common';

/**
 * LMSR (Logarithmic Market Scoring Rule) Pricing Engine
 * 
 * Used by prediction markets like Polymarket and Kalshi.
 * Provides automatic market making with bounded loss.
 * 
 * Formula:
 * Cost(q) = b * ln(e^(q1/b) + e^(q2/b) + ... + e^(qn/b))
 * 
 * Where:
 * - q = quantity array for each outcome
 * - b = liquidity parameter (higher = more stable prices, more liquidity needed)
 */

export interface MarketState {
  marketId: string;
  liquidityParameter: number;  // b in LMSR
  quantities: number[];        // shares for each outcome
  outcomes: string[];          // outcome IDs
}

export interface PriceResult {
  prices: Map<string, number>;
  totalCost: number;
}

export interface BetPreview {
  outcomeId: string;
  shares: number;
  avgPrice: number;
  cost: number;
  newPrice: number;
  priceImpact: number;
}

@Injectable()
export class LmsrPricingService {
  private readonly logger = new Logger(LmsrPricingService.name);

  /**
   * Calculate cost function C(q)
   */
  calculateCost(quantities: number[], b: number): number {
    const expSum = quantities.reduce((sum, q) => sum + Math.exp(q / b), 0);
    return b * Math.log(expSum);
  }

  /**
   * Calculate price for a single outcome
   * P(i) = e^(q_i / b) / sum(e^(q_j / b))
   */
  calculatePrice(outcomeIndex: number, quantities: number[], b: number): number {
    const expValues = quantities.map(q => Math.exp(q / b));
    const expSum = expValues.reduce((sum, e) => sum + e, 0);
    return expValues[outcomeIndex] / expSum;
  }

  /**
   * Calculate all prices for a market
   */
  calculateAllPrices(market: MarketState): Map<string, number> {
    const prices = new Map<string, number>();
    
    for (let i = 0; i < market.outcomes.length; i++) {
      const price = this.calculatePrice(i, market.quantities, market.liquidityParameter);
      prices.set(market.outcomes[i], price);
    }
    
    return prices;
  }

  /**
   * Calculate cost to buy shares
   * Returns the amount user needs to pay
   */
  calculateBuyCost(
    outcomeIndex: number,
    sharesAmount: number,
    currentQuantities: number[],
    b: number,
  ): number {
    const costBefore = this.calculateCost(currentQuantities, b);
    
    const newQuantities = [...currentQuantities];
    newQuantities[outcomeIndex] += sharesAmount;
    
    const costAfter = this.calculateCost(newQuantities, b);
    
    return costAfter - costBefore;
  }

  /**
   * Calculate shares received for a given cost
   * Uses binary search to find shares amount
   */
  calculateSharesForCost(
    outcomeIndex: number,
    costAmount: number,
    currentQuantities: number[],
    b: number,
  ): number {
    let low = 0;
    let high = costAmount * 10; // Start with high estimate
    const tolerance = 0.01;
    
    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      const cost = this.calculateBuyCost(outcomeIndex, mid, currentQuantities, b);
      
      if (cost < costAmount) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return low;
  }

  /**
   * Preview a bet
   */
  previewBet(
    market: MarketState,
    outcomeId: string,
    stakeAmount: number,
  ): BetPreview {
    const outcomeIndex = market.outcomes.indexOf(outcomeId);
    
    if (outcomeIndex === -1) {
      throw new Error(`Invalid outcome: ${outcomeId}`);
    }
    
    const b = market.liquidityParameter;
    
    // Current price
    const currentPrice = this.calculatePrice(outcomeIndex, market.quantities, b);
    
    // Calculate shares for stake
    const shares = this.calculateSharesForCost(outcomeIndex, stakeAmount, market.quantities, b);
    
    // Calculate actual cost (should be close to stakeAmount)
    const cost = this.calculateBuyCost(outcomeIndex, shares, market.quantities, b);
    
    // Calculate new price after bet
    const newQuantities = [...market.quantities];
    newQuantities[outcomeIndex] += shares;
    const newPrice = this.calculatePrice(outcomeIndex, newQuantities, b);
    
    // Average price
    const avgPrice = cost / shares;
    
    // Price impact
    const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
    
    return {
      outcomeId,
      shares,
      avgPrice,
      cost,
      newPrice,
      priceImpact,
    };
  }

  /**
   * Execute a bet and return new market state
   */
  executeBet(
    market: MarketState,
    outcomeId: string,
    stakeAmount: number,
  ): { newState: MarketState; preview: BetPreview } {
    const preview = this.previewBet(market, outcomeId, stakeAmount);
    
    const outcomeIndex = market.outcomes.indexOf(outcomeId);
    const newQuantities = [...market.quantities];
    newQuantities[outcomeIndex] += preview.shares;
    
    const newState: MarketState = {
      ...market,
      quantities: newQuantities,
    };
    
    return { newState, preview };
  }

  /**
   * Calculate potential payout for shares
   * If outcome wins, each share pays out $1
   */
  calculatePotentialPayout(shares: number, fee: number = 0.03): number {
    return shares * (1 - fee);
  }

  /**
   * Calculate maximum platform loss
   * maxLoss = b * ln(n) where n = number of outcomes
   */
  calculateMaxPlatformLoss(b: number, numOutcomes: number): number {
    return b * Math.log(numOutcomes);
  }

  /**
   * Suggested liquidity parameter based on expected volume
   */
  suggestLiquidityParameter(expectedVolume: number, numOutcomes: number): number {
    // Rule of thumb: b should be around 1/3 of expected volume
    // This ensures prices move but not too dramatically
    const suggested = expectedVolume / 3;
    
    // Minimum values based on outcomes
    const minimums: Record<number, number> = {
      2: 50,   // Binary markets
      3: 100,
      4: 150,
      5: 200,
    };
    
    return Math.max(suggested, minimums[numOutcomes] || 100);
  }

  /**
   * Initialize market with equal prices
   */
  initializeMarket(
    marketId: string,
    outcomes: string[],
    liquidityParameter: number,
  ): MarketState {
    // Start with equal quantities so prices are equal
    const initialQuantity = 0;
    const quantities = outcomes.map(() => initialQuantity);
    
    return {
      marketId,
      liquidityParameter,
      quantities,
      outcomes,
    };
  }

  /**
   * Seed initial liquidity
   * This adds equal amounts to all outcomes to provide initial liquidity
   */
  seedLiquidity(market: MarketState, amount: number): MarketState {
    const sharePerOutcome = amount / market.outcomes.length;
    const newQuantities = market.quantities.map(q => q + sharePerOutcome);
    
    return {
      ...market,
      quantities: newQuantities,
    };
  }

  /**
   * Calculate odds from price
   * odds = 1 / price
   */
  priceToOdds(price: number): number {
    return 1 / price;
  }

  /**
   * Calculate implied probability from odds
   */
  oddsToImpliedProbability(odds: number): number {
    return 1 / odds;
  }
}
