import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LmsrPricingService, MarketState } from './lmsr-pricing.service';
import { QuoteService } from './quote.service';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: LmsrPricingService,
    private readonly quoteService: QuoteService,
  ) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview bet with LMSR pricing' })
  previewBet(
    @Body() body: {
      marketId: string;
      liquidityParameter: number;
      quantities: number[];
      outcomes: string[];
      outcomeId: string;
      stakeAmount: number;
    },
  ) {
    const market: MarketState = {
      marketId: body.marketId,
      liquidityParameter: body.liquidityParameter,
      quantities: body.quantities,
      outcomes: body.outcomes,
    };

    const preview = this.pricingService.previewBet(market, body.outcomeId, body.stakeAmount);
    
    return {
      success: true,
      data: {
        ...preview,
        potentialPayout: this.pricingService.calculatePotentialPayout(preview.shares),
        currentPrices: Object.fromEntries(this.pricingService.calculateAllPrices(market)),
      },
    };
  }

  @Post('calculate-prices')
  @ApiOperation({ summary: 'Calculate all prices for market state' })
  calculatePrices(
    @Body() body: {
      liquidityParameter: number;
      quantities: number[];
      outcomes: string[];
    },
  ) {
    const market: MarketState = {
      marketId: 'temp',
      liquidityParameter: body.liquidityParameter,
      quantities: body.quantities,
      outcomes: body.outcomes,
    };

    const prices = this.pricingService.calculateAllPrices(market);
    
    return {
      success: true,
      data: {
        prices: Object.fromEntries(prices),
        odds: Object.fromEntries(
          Array.from(prices.entries()).map(([k, v]) => [k, this.pricingService.priceToOdds(v)])
        ),
      },
    };
  }

  @Get('suggest-liquidity')
  @ApiOperation({ summary: 'Get suggested liquidity parameter' })
  suggestLiquidity(
    @Query('expectedVolume') expectedVolume: string,
    @Query('outcomes') outcomes: string,
  ) {
    const suggested = this.pricingService.suggestLiquidityParameter(
      parseFloat(expectedVolume || '1000'),
      parseInt(outcomes || '2'),
    );
    
    const maxLoss = this.pricingService.calculateMaxPlatformLoss(
      suggested,
      parseInt(outcomes || '2'),
    );
    
    return {
      success: true,
      data: {
        suggestedLiquidityParameter: suggested,
        maxPlatformLoss: maxLoss,
      },
    };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize new market with LMSR' })
  initializeMarket(
    @Body() body: {
      marketId: string;
      outcomes: string[];
      liquidityParameter?: number;
      initialLiquidity?: number;
    },
  ) {
    const b = body.liquidityParameter || 
      this.pricingService.suggestLiquidityParameter(1000, body.outcomes.length);
    
    let market = this.pricingService.initializeMarket(body.marketId, body.outcomes, b);
    
    if (body.initialLiquidity) {
      market = this.pricingService.seedLiquidity(market, body.initialLiquidity);
    }
    
    const prices = this.pricingService.calculateAllPrices(market);
    
    return {
      success: true,
      data: {
        market,
        prices: Object.fromEntries(prices),
        maxPlatformLoss: this.pricingService.calculateMaxPlatformLoss(b, body.outcomes.length),
      },
    };
  }

  // ============ On-Chain Quote Generation ============

  @Post('quote')
  @ApiOperation({ summary: 'Generate signed quote for on-chain betting' })
  async generateQuote(
    @Body() body: {
      user: string;
      marketId: string;
      outcomeId: number;
      stakeAmount: number; // Amount in human-readable format (e.g., 100 USDT)
      liquidityParameter: number;
      quantities: number[];
      outcomes: string[];
    },
  ) {
    if (!this.quoteService.isAvailable()) {
      return {
        success: false,
        error: 'Quote signing not available. QUOTER_PRIVATE_KEY not configured.',
      };
    }

    // Calculate LMSR pricing
    const market: MarketState = {
      marketId: body.marketId,
      liquidityParameter: body.liquidityParameter,
      quantities: body.quantities,
      outcomes: body.outcomes,
    };

    const outcomeIdStr = body.outcomeId.toString();
    const preview = this.pricingService.previewBet(market, outcomeIdStr, body.stakeAmount);

    // Convert to wei (18 decimals)
    const amountWei = BigInt(Math.floor(body.stakeAmount * 1e18)).toString();
    const sharesWei = BigInt(Math.floor(preview.shares * 1e18)).toString();
    const entryPriceE18 = BigInt(Math.floor(preview.avgPrice * 1e18)).toString();

    // Generate signed quote
    const signedQuote = await this.quoteService.generateQuote({
      user: body.user,
      marketId: body.marketId,
      outcomeId: body.outcomeId,
      amount: amountWei,
      shares: sharesWei,
      entryPriceE18,
    });

    if (!signedQuote) {
      return {
        success: false,
        error: 'Failed to generate signed quote',
      };
    }

    return {
      success: true,
      data: {
        quote: signedQuote.quote,
        signature: signedQuote.signature,
        expiresAt: signedQuote.expiresAt,
        preview: {
          shares: preview.shares,
          avgPrice: preview.avgPrice,
          cost: preview.cost,
          newPrice: preview.newPrice,
          priceImpact: preview.priceImpact,
          potentialPayout: this.pricingService.calculatePotentialPayout(preview.shares),
        },
      },
    };
  }

  @Get('quote/status')
  @ApiOperation({ summary: 'Check quote signing availability' })
  getQuoteStatus() {
    return {
      success: true,
      data: {
        available: this.quoteService.isAvailable(),
        signer: this.quoteService.getSignerInfo(),
      },
    };
  }
}
