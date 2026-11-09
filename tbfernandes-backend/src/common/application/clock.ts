import { IsoDate } from '../domain';

/**
 * One clock for the whole app, in the user's time zone (TBF_TIME_ZONE), so "today" and
 * "this week" match what the user sees. Tests replace it to fix "today".
 */
export abstract class Clock {
  abstract now(): Date;
  abstract today(): IsoDate;
  abstract startOfWeek(): Date;
}
