import { Controller, Get } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ValidatedQuery } from '../../../common/decorators';
import { CashFlowService } from '../application/cash-flow.service';
import {
  CashFlowMapper,
  cashFlowQuerySchema,
  CashFlowResponse,
} from '../protocols';
import type { CashFlowQuery } from '../protocols';

@ApiTags('finance')
@Controller('finance/cash-flow')
export class CashFlowController {
  constructor(private readonly cashFlow: CashFlowService) {}

  /** month=YYYY-MM (default: current), months=how many to show ending at it (default 6, up to 24). */
  @Get()
  @ApiQuery({ name: 'month', required: false, type: String })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiQuery({ name: 'scope', required: false, type: String })
  async get(
    @ValidatedQuery(cashFlowQuerySchema) query: CashFlowQuery,
  ): Promise<CashFlowResponse> {
    return CashFlowMapper.toResponse(
      await this.cashFlow.cashFlow(query.month, query.months, query.scope),
    );
  }
}
