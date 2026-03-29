import { Controller, Post, UseGuards } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  /**
   * Manually trigger oracle check (admin only)
   * POST /api/oracle/trigger
   */
  @Post('trigger')
  async triggerCheck() {
    const result = await this.oracleService.triggerOracleCheck();
    return ApiResponse.success(result, `Checked ${result.checked} markets, resolved ${result.resolved}`);
  }
}
