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
    return (await this.purchaseGoals.findAll(ownerId)).map((purchaseGoal) => {
      const projection = purchaseGoal.project(today);
      const details = purchaseGoal.details;
      return {
        id: purchaseGoal.id,
        name: details.name,
        status: purchaseGoal.status.toLowerCase(),
        goalId: details.goalId,
        estimated: Money.toNumber(details.estimated),
        reserved: Money.toNumber(purchaseGoal.reserved),
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
