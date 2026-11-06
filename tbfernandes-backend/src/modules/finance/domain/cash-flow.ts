import { YearMonth, YearMonths } from '../../../common/domain';
import { EntryScope, FinanceEntry, totalOf } from './entry/finance-entry';
import { Cents } from './money';

export interface MonthTotals {
  month: YearMonth;
  income: Cents;
  expense: Cents;
  balance: Cents;
}

export interface CategoryTotal {
  category: string;
  amount: Cents;
}

export interface CashFlow {
  month: YearMonth;
  /** Null sums both scopes, which the screen warns can double count transfers. */
  scope: EntryScope | null;
  totals: MonthTotals;
  series: MonthTotals[];
  expensesByCategory: CategoryTotal[];
}

export const CashFlows = {
  firstMonth(selected: YearMonth, months: number): YearMonth {
    return YearMonths.plusMonths(selected, -(Math.max(1, months) - 1));
  },

  build(
    selected: YearMonth,
    months: number,
    scope: EntryScope | null,
    entries: readonly FinanceEntry[],
  ): CashFlow {
    const byMonth = new Map<YearMonth, FinanceEntry[]>();
    for (const entry of entries) {
      const month = YearMonths.of(entry.details.date);
      byMonth.set(month, [...(byMonth.get(month) ?? []), entry]);
    }
    const series: MonthTotals[] = [];
    for (
      let month = CashFlows.firstMonth(selected, months);
      month <= selected;
      month = YearMonths.plusMonths(month, 1)
    ) {
      series.push(CashFlows.totals(month, byMonth.get(month) ?? []));
    }
    const byCategory = new Map<string, Cents>();
    for (const entry of byMonth.get(selected) ?? []) {
      const details = entry.details;
      if (details.kind !== 'EXPENSE') continue;
      byCategory.set(
        details.category,
        (byCategory.get(details.category) ?? 0) + details.amount,
      );
    }
    const expensesByCategory = [...byCategory]
      .map(([category, amount]) => ({ category, amount }))
      .sort((left, right) => right.amount - left.amount);
    return {
      month: selected,
      scope,
      totals: series[series.length - 1],
      series,
      expensesByCategory,
    };
  },

  totals(month: YearMonth, entries: readonly FinanceEntry[]): MonthTotals {
    const income = totalOf(entries, 'INCOME');
    const expense = totalOf(entries, 'EXPENSE');
    return { month, income, expense, balance: income - expense };
  },
};
