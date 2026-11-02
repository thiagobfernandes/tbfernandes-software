import { IsoDate } from './types';

/** Calendar arithmetic on YYYY-MM-DD values, free of time zones. */
export const IsoDates = {
  plusDays(day: IsoDate, days: number): IsoDate {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  },
};

/** A calendar month as the API writes it: YYYY-MM. Compares as text. */
export type YearMonth = string;

export const YearMonths = {
  of(day: IsoDate): YearMonth {
    return day.slice(0, 7);
  },

  plusMonths(month: YearMonth, months: number): YearMonth {
    const [year, m] = month.split('-').map(Number);
    const index = year * 12 + (m - 1) + months;
    const y = Math.floor(index / 12);
    return `${String(y).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
  },

  firstDay(month: YearMonth): IsoDate {
    return `${month}-01`;
  },

  lastDay(month: YearMonth): IsoDate {
    return IsoDates.plusDays(
      YearMonths.firstDay(YearMonths.plusMonths(month, 1)),
      -1,
    );
  },
};
