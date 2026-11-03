import { IsoDate, IsoDates } from '../../../common/domain';

const SHORT_MONTHS = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
];

const LONG_MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Wording of dates and money, the same as the frontend's lib/dates.ts and lib/money.ts. */
export const Format = {
  daysBetween(from: IsoDate, to: IsoDate): number {
    return IsoDates.daysBetween(from, to);
  },

  /** "atrasada 2d", "vence hoje", "vence amanhã", "vence em 4d" or "vence 30 de out.". */
  due(dueDate: IsoDate, today: IsoDate): string {
    const diff = Format.daysBetween(today, dueDate);
    if (diff < 0) return `atrasada ${-diff}d`;
    if (diff === 0) return 'vence hoje';
    if (diff === 1) return 'vence amanhã';
    if (diff <= 7) return `vence em ${diff}d`;
    const [, month, day] = dueDate.split('-').map(Number);
    return `vence ${day} de ${SHORT_MONTHS[month - 1]}`;
  },

  /** "novembro de 2026". */
  month(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    return `${LONG_MONTHS[month - 1]} de ${year}`;
  },

  /** Whole reais ("R$ 1.234"), rounding half up. */
  brl(value: number): string {
    return BRL.format(Math.round(value * 100) / 100);
  },

  /** Lower case without accents, to compare names and words. */
  fold(value: string): string {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  },

  present(value: string | null | undefined): value is string {
    return value != null && value.trim() !== '';
  },
};
