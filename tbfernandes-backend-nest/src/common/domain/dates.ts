import { IsoDate } from './types';

/** Calendar arithmetic on YYYY-MM-DD values, free of time zones. */
export const IsoDates = {
  plusDays(day: IsoDate, days: number): IsoDate {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  },
};
