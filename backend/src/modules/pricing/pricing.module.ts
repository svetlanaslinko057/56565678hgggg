import { Module } from '@nestjs/common';
import { LmsrPricingService } from './lmsr-pricing.service';
import { QuoteService } from './quote.service';
import { PricingController } from './pricing.controller';

@Module({
  controllers: [PricingController],
  providers: [LmsrPricingService, QuoteService],
  exports: [LmsrPricingService, QuoteService],
})
export class PricingModule {}
