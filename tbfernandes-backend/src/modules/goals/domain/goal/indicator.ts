import { InvalidArgumentError, Require } from '../../../../common/domain';

/**
 * A decimal with two places, kept as an integer number of hundredths so sums and
 * comparisons are exact (numeric(14,2) in the database).
 */
export type Hundredths = number;

const numberWithoutExponent = (value: number) =>
  /e/i.test(String(value))
    ? value.toFixed(20).replace(/\.?0+$/, '')
    : String(value);

export const Decimals = {
  /**
   * From a JSON number or numeric text, rounding half away from zero like PostgreSQL does
   * when it stores numeric(14,2), so the answer matches what is saved.
   */
  hundredths(value: number | string): Hundredths {
    const text =
      typeof value === 'number' ? numberWithoutExponent(value) : value.trim();
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);
    if (!match) throw new InvalidArgumentError(`valor inválido: ${text}`);
    const [, sign, whole, fraction = ''] = match;
    const digits = fraction.padEnd(3, '0');
    let result = Number(whole || '0') * 100 + Number(digits.slice(0, 2));
    if (digits[2] >= '5') result += 1;
    return sign && result !== 0 ? -result : result;
  },

  toNumber(value: Hundredths): number {
    return value / 100;
  },

  toText(value: Hundredths): string {
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  },
};

/** Measurable indicator, e.g. "Guardado para a entrada: 6000 / 20000 BRL". */
export interface Indicator {
  label: string;
  current: Hundredths;
  target: Hundredths;
  unit: string;
}

/** An indicator as written by the user; current defaults to zero. */
export interface IndicatorDetails {
  label: string;
  current: Hundredths | null;
  target: Hundredths | null;
  unit: string;
}

export const Indicators = {
  of(details: IndicatorDetails): Indicator {
    const target = Require.present(details.target, 'indicator target');
    if (target <= 0)
      throw new InvalidArgumentError(
        'indicator target deve ser maior que zero',
      );
    return {
      label: Require.text(details.label, 'indicator label', 120),
      current: details.current ?? 0,
      target,
      unit: Require.text(details.unit, 'indicator unit', 20),
    };
  },

  /** Progress from 0 to 100, rounded half up like the frontend's Math.round, capped. */
  roundedPercent(indicator: Indicator): number {
    const percent = Math.floor(
      (200 * indicator.current + indicator.target) / (2 * indicator.target),
    );
    return Math.min(100, Math.max(0, percent));
  },
};
