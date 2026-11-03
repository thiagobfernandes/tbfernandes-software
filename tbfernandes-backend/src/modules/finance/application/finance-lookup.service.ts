import { Injectable } from '@nestjs/common';
import { Clock } from '../../../common/application';
import { YearMonth, YearMonths } from '../../../common/domain';
import {
  EntryScope,
  FinanceEntryRepository,
  Money,
  PurchaseGoalRepository,
  totalOf,
} from '../domain';
import { FinanceLookup, MonthView, PurchaseView } from '../finance.lookup';

/** FinanceLookup on the repositories. */
@Injectable()
export class FinanceLookupService extends FinanceLookup {
  constructor(
    private readonly purchaseGoals: PurchaseGoalRepository,
    private readonly entries: FinanceEntryRepository,
    private readonly clock: Clock,
  ) {
    super();
  }

  async purchases(ownerId: string): Promise<PurchaseView[]> {
    const today = this.clock.today();
    return (await this.purchaseGoals.findAll(ownerId)).map((p) => {
      const projection = p.project(today);
      const d = p.details;
      return {
        id: p.id,
        name: d.name,
        status: p.status.toLowerCase(),
        goalId: d.goalId,
        estimated: Money.toNumber(d.estimated),
        reserved: Money.toNumber(p.reserved),
        missing: Money.toNumber(projection.missing),
        ready: projection.ready,
        months: projection.months,
        onTime: projection.onTime,
      };
    });
  }

  async month(ownerId: string, month: YearMonth): Promise<MonthView> {
    const [personal, business] = await Promise.all(
      (['PERSONAL', 'BUSINESS'] as EntryScope[]).map((scope) =>
        this.entries.findAll(ownerId, {
          from: YearMonths.firstDay(month),
          to: YearMonths.lastDay(month),
          scope,
        }),
      ),
    );
    return {
      month,
      personalIncome: Money.toNumber(totalOf(personal, 'INCOME')),
      personalExpense: Money.toNumber(totalOf(personal, 'EXPENSE')),
      businessIncome: Money.toNumber(totalOf(business, 'INCOME')),
      businessExpense: Money.toNumber(totalOf(business, 'EXPENSE')),
    };
  }
}
