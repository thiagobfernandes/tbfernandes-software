import { InvalidArgumentError } from '../../../common/domain';

/** An amount in BRL cents. Integers keep sums exact (RNF-API-03: two decimals). */
export type Cents = number;

/**
 * Decimal amounts ↔ cents, rounding half to even like the database and the old backend.
 * Accepts the numbers of the JSON and the strings of PostgreSQL numeric.
 */
export const Money = {
  cents(value: number | string): Cents {
    const text = typeof value === 'number' ? Money.plain(value) : value.trim();
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);
    if (!match) throw new InvalidArgumentError(`valor inválido: ${text}`);
    const [, sign, whole, fraction = ''] = match;
    const digits = fraction.padEnd(3, '0');
    let cents = Number(whole || '0') * 100 + Number(digits.slice(0, 2));
    const rest = digits.slice(2);
    const half = rest[0] === '5' && /^0*$/.test(rest.slice(1));
    if (
      rest[0] > '5' ||
      (rest[0] === '5' && !half) ||
      (half && cents % 2 === 1)
    )
      cents += 1;
    return sign && cents !== 0 ? -cents : cents;
  },

  /** For the JSON: 1500 for 150000 cents, 12.5 for 1250. */
  toNumber(cents: Cents): number {
    return cents / 100;
  },

  /** For PostgreSQL numeric: "1500.00". */
  toDecimal(cents: Cents): string {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  },

  positive(value: Cents | null | undefined, field: string): Cents {
    if (value == null || value <= 0) {
      throw new InvalidArgumentError(`${field} deve ser maior que zero`);
    }
    return value;
  },

  optionalPositive(value: Cents | null | undefined, field: string) {
    return value == null ? null : Money.positive(value, field);
  },

  /**
   * Decimal text of a JSON number as it was written (12.345 stays "12.345", not the binary
   * 12.3449999…), without exponent (1e-7 → "0.0000001").
   */
  plain(value: number): string {
    const text = String(value);
    return /e/i.test(text) ? value.toFixed(20).replace(/\.?0+$/, '') : text;
  },
};
