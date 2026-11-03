import { Injectable } from '@nestjs/common';
import { Clock, OwnerContext } from '../../../common/application';
import { YearMonth, YearMonths } from '../../../common/domain';
import {
  CashFlow,
  CashFlows,
  EntryScope,
  FinanceEntryRepository,
} from '../domain';

/** How many months the cash flow shows at most. */
export const MAX_CASH_FLOW_MONTHS = 24;

/** FIN-02: cash flow of a month and the months before it. */
@Injectable()
export class CashFlowService {
  constructor(
    private readonly entries: FinanceEntryRepository,
    private readonly owner: OwnerContext,
    private readonly clock: Clock,
  ) {}

  /** @param month default: the current month */
  async cashFlow(
    month: YearMonth | null,
    months: number,
    scope: EntryScope | null,
  ): Promise<CashFlow> {
    const selected = month ?? YearMonths.of(this.clock.today());
    const count = Math.min(Math.max(1, months), MAX_CASH_FLOW_MONTHS);
    const entries = await this.entries.findAll(this.owner.currentOwnerId(), {
      from: YearMonths.firstDay(CashFlows.firstMonth(selected, count)),
      to: YearMonths.lastDay(selected),
      scope,
    });
    return CashFlows.build(selected, count, scope, entries);
  }
}
