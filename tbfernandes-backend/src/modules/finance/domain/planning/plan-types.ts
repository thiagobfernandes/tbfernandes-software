import { YearMonth, YearMonths } from '../../../../common/domain';
import { ClosedMonthError } from '../errors';

/** How sure a number is: shown next to every amount of the plan (RN-PLN-04). */
export const CERTAINTIES = ['CONFIRMED', 'ESTIMATED', 'UNKNOWN'] as const;
export type Certainty = (typeof CERTAINTIES)[number];

/**
 * Months up to `closedThrough` are closed: their payments, statements and plan are final
 * (RN-PLN-01). Every change to the plan says which month it touches first.
 */
export class MonthLock {
  private constructor(readonly closedThrough: YearMonth | null) {}

  static none(): MonthLock {
    return new MonthLock(null);
  }

  static through(month: YearMonth | null): MonthLock {
    return new MonthLock(month);
  }

  isClosed(month: YearMonth): boolean {
    return this.closedThrough !== null && month <= this.closedThrough;
  }

  assertOpen(month: YearMonth): void {
    if (this.isClosed(month)) throw new ClosedMonthError(month);
  }
}

/** Every month from `from` to `to`, both included. */
export function monthsBetween(from: YearMonth, to: YearMonth): YearMonth[] {
  const months: YearMonth[] = [];
  for (let month = from; month <= to; month = YearMonths.plusMonths(month, 1)) {
    months.push(month);
  }
  return months;
}

export function monthDiff(from: YearMonth, to: YearMonth): number {
  const index = (month: YearMonth) =>
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  return index(to) - index(from);
}

/** Day `day` of a month, clamped to its last day (31 in February is the 28th or 29th). */
export function dayOfMonth(month: YearMonth, day: number): string {
  const last = Number(YearMonths.lastDay(month).slice(8, 10));
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}
