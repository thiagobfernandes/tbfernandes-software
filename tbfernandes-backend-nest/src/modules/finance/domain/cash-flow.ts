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

/** FIN-02: the selected month plus the months before it, as the cash flow screen shows. */
export interface CashFlow {
  month: YearMonth;
  /** Null sums both scopes, which the screen warns can double count transfers. */
  scope: EntryScope | null;
  totals: MonthTotals;
  series: MonthTotals[];
  expensesByCategory: CategoryTotal[];
}

export const CashFlows = {
  /** The first month a cash flow of `months` months ending at `selected` covers. */
  firstMonth(selected: YearMonth, months: number): YearMonth {
    return YearMonths.plusMonths(selected, -(Math.max(1, months) - 1));
  },

  /** @param entries the entries from the first month to the selected one */
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
      let m = CashFlows.firstMonth(selected, months);
      m <= selected;
      m = YearMonths.plusMonths(m, 1)
    ) {
      series.push(CashFlows.totals(m, byMonth.get(m) ?? []));
    }
    const byCategory = new Map<string, Cents>();
    for (const entry of byMonth.get(selected) ?? []) {
      const d = entry.details;
      if (d.kind !== 'EXPENSE') continue;
      byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + d.amount);
    }
    const expensesByCategory = [...byCategory]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
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
