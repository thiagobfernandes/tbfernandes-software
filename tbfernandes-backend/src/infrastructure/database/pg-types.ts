import { types } from 'pg';

const DATE = 1082;
const INT8 = 20;

/**
 * `date` stays the text PostgreSQL sends (YYYY-MM-DD): turning it into a JS Date would move
 * it to UTC midnight and shift the day. Counts (bigint) come back as numbers; they never
 * pass 2^53 here. `numeric` stays text and each entity converts it where it is money.
 */
export function configurePgTypes(): void {
  types.setTypeParser(DATE, (value) => value);
  types.setTypeParser(INT8, (value) => Number(value));
}
