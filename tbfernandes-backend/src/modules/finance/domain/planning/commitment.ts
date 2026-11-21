import {
  InvalidArgumentError,
  IsoDate,
  Require,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { InstallmentsExceedDebtError } from '../errors';
import { Cents, Money } from '../money';
import { Certainty, MonthLock, monthDiff } from './plan-types';

export const COMMITMENT_CATEGORIES = [
  'SALARY',
  'FREELANCE',
  'OTHER_INCOME',
  'LOAN',
  'FIXED',
  'SUBSCRIPTION',
  'EXTRA',
] as const;
export type CommitmentCategory = (typeof COMMITMENT_CATEGORIES)[number];

const INCOME_CATEGORIES: readonly CommitmentCategory[] = [
  'SALARY',
  'FREELANCE',
  'OTHER_INCOME',
];

export type Direction = 'INCOME' | 'EXPENSE';

const NOTHING_PLANNED = {
  amount: 0,
  certainty: 'CONFIRMED' as Certainty,
  note: null,
};

/** A schedule never runs longer than this, so an open-ended loan cannot loop forever. */
const MAX_SCHEDULE_MONTHS = 600;

export interface CommitmentDetails {
  name: string;
  category: CommitmentCategory;
  dueDay: number | null;
  startMonth: YearMonth;
  /** Last month, included. Null: until further notice. */
  endMonth: YearMonth | null;
  /** Debt total: the commitment ends once its payments reach it (RN-PLN-02). */
  total: Cents | null;
  /** Charged on this card: shown in the plan but never added again, the statement has it (RN-PLN-05). */
  cardId: string | null;
  notes: string | null;
}

/** The amount from a month on. Earlier months keep their own change (RN-PLN-06). */
export interface CommitmentChange {
  fromMonth: YearMonth;
  amount: Cents;
  /** False suspends the commitment from this month on (a subscription on hold). */
  active: boolean;
  certainty: Certainty;
  note: string | null;
}

/** A different amount in one month only, e.g. a December installment of R$ 88 instead of 83. */
export interface MonthOverride {
  month: YearMonth;
  amount: Cents;
  certainty: Certainty;
  note: string | null;
}

/** What was actually paid, or received for income, in a month. */
export interface CommitmentPayment {
  month: YearMonth;
  amount: Cents;
  paidOn: IsoDate;
}

export interface Occurrence {
  month: YearMonth;
  planned: Cents;
  certainty: Certainty;
  note: string | null;
  payment: CommitmentPayment | null;
  /** The payment when there is one, the planned amount otherwise. */
  effective: Cents;
  installment: { number: number; total: number | null } | null;
  last: boolean;
}

export interface ChangeInput {
  amount: Cents;
  active: boolean;
  certainty: Certainty;
  note: string | null;
}

/**
 * Anything that repeats or happens once in the monthly plan: salary, freelances, loans, bills,
 * subscriptions and one-off expenses. Its history is a list of changes, so editing it from a
 * month on never rewrites the months before (RN-PLN-06).
 */
export class Commitment {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: CommitmentDetails,
    private _changes: CommitmentChange[],
    private _overrides: MonthOverride[],
    private _payments: CommitmentPayment[],
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: CommitmentDetails,
    first: Omit<ChangeInput, 'active'>,
    lock: MonthLock,
  ): Commitment {
    const valid = Commitment.validDetails(details);
    lock.assertOpen(valid.startMonth);
    const commitment = new Commitment(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      valid,
      [Commitment.validChange({ ...first, active: true }, valid.startMonth)],
      [],
      [],
    );
    commitment.assertWithinTotal();
    return commitment;
  }

  static restore(
    id: string,
    ownerId: string,
    details: CommitmentDetails,
    changes: CommitmentChange[],
    overrides: MonthOverride[],
    payments: CommitmentPayment[],
  ): Commitment {
    return new Commitment(
      id,
      ownerId,
      details,
      Commitment.sorted(changes, 'fromMonth'),
      Commitment.sorted(overrides, 'month'),
      Commitment.sorted(payments, 'month'),
    );
  }

  get details(): CommitmentDetails {
    return { ...this._details };
  }

  get changes(): CommitmentChange[] {
    return this._changes.map((change) => ({ ...change }));
  }

  get overrides(): MonthOverride[] {
    return this._overrides.map((override) => ({ ...override }));
  }

  get payments(): CommitmentPayment[] {
    return this._payments.map((payment) => ({ ...payment }));
  }

  get direction(): Direction {
    return INCOME_CATEGORIES.includes(this._details.category)
      ? 'INCOME'
      : 'EXPENSE';
  }

  /** On a card: part of a statement, so never counted on its own. */
  get counted(): boolean {
    return this._details.cardId === null;
  }

  update(details: CommitmentDetails, lock: MonthLock): void {
    const valid = Commitment.validDetails(details);
    const current = this._details;
    if (valid.startMonth !== current.startMonth) {
      lock.assertOpen(minMonth(valid.startMonth, current.startMonth));
    }
    if (valid.endMonth !== current.endMonth) {
      lock.assertOpen(earliestEnd(valid.endMonth, current.endMonth));
    }
    if (valid.total !== current.total || valid.cardId !== current.cardId) {
      lock.assertOpen(this.firstOpenMonth(lock));
    }
    this._details = valid;
    this._changes = this.changesFrom(valid.startMonth);
    this.assertWithinTotal();
  }

  /** Changes amount, certainty or suspension from a month on, keeping the months before. */
  changeFrom(fromMonth: YearMonth, input: ChangeInput, lock: MonthLock): void {
    lock.assertOpen(fromMonth);
    if (fromMonth < this._details.startMonth) {
      throw new InvalidArgumentError(
        'a alteração não pode começar antes do início do compromisso',
      );
    }
    const change = Commitment.validChange(input, fromMonth);
    this._changes = Commitment.sorted(
      [...this._changes.filter((item) => item.fromMonth !== fromMonth), change],
      'fromMonth',
    );
    this.assertWithinTotal();
  }

  /** Ends after `month` (included); null makes it open-ended again. */
  endAt(month: YearMonth | null, lock: MonthLock): void {
    this.update({ ...this._details, endMonth: month }, lock);
  }

  setOverride(override: MonthOverride, lock: MonthLock): void {
    lock.assertOpen(override.month);
    if (override.amount < 0) {
      throw new InvalidArgumentError('o valor do mês não pode ser negativo');
    }
    this._overrides = Commitment.sorted(
      [
        ...this._overrides.filter((item) => item.month !== override.month),
        { ...override, note: Require.optionalText(override.note, 'note', 300) },
      ],
      'month',
    );
    this.assertWithinTotal();
  }

  clearOverride(month: YearMonth, lock: MonthLock): void {
    lock.assertOpen(month);
    this._overrides = this._overrides.filter((item) => item.month !== month);
  }

  recordPayment(payment: CommitmentPayment, lock: MonthLock): void {
    lock.assertOpen(payment.month);
    Money.positive(payment.amount, 'amount');
    Require.present(payment.paidOn, 'paidOn');
    this._payments = Commitment.sorted(
      [
        ...this._payments.filter((item) => item.month !== payment.month),
        { ...payment },
      ],
      'month',
    );
  }

  removePayment(month: YearMonth, lock: MonthLock): void {
    lock.assertOpen(month);
    this._payments = this._payments.filter((item) => item.month !== month);
  }

  /** The plan for a month before payments and the debt cap; null outside it or when suspended. */
  plannedFor(month: YearMonth) {
    const { startMonth, endMonth } = this._details;
    if (month < startMonth || (endMonth !== null && month > endMonth)) {
      return null;
    }
    const override = this._overrides.find((item) => item.month === month);
    if (override) return { ...override, overridden: true };
    const change = this.changeAt(month);
    if (!change?.active) return null;
    return { ...change, month, overridden: false };
  }

  /** Occurrences up to `until`, with payments and the debt cap applied. */
  schedule(until: YearMonth): Occurrence[] {
    const finite = this._details.endMonth !== null || this.isDebtWithTotal();
    const limit = YearMonths.plusMonths(
      this._details.startMonth,
      MAX_SCHEDULE_MONTHS,
    );
    const last = finite ? limit : minMonth(until, limit);
    const occurrences = this.buildSchedule(last);
    return occurrences.filter((occurrence) => occurrence.month <= until);
  }

  /** What is still owed after a month; null when the debt has no known end. */
  remainingAfter(month: YearMonth): Cents | null {
    if (this._details.category !== 'LOAN') return 0;
    const { endMonth, total } = this._details;
    if (endMonth === null && total === null) return null;
    return this.schedule(YearMonths.plusMonths(month, MAX_SCHEDULE_MONTHS))
      .filter((occurrence) => occurrence.month > month)
      .reduce((sum, occurrence) => sum + occurrence.effective, 0);
  }

  /** The last month with an occurrence, or null when open-ended. */
  lastMonth(): YearMonth | null {
    if (this._details.endMonth === null && !this.isDebtWithTotal()) return null;
    const all = this.buildSchedule(
      YearMonths.plusMonths(this._details.startMonth, MAX_SCHEDULE_MONTHS),
    );
    return all.at(-1)?.month ?? null;
  }

  private buildSchedule(until: YearMonth): Occurrence[] {
    const { startMonth, total } = this._details;
    const debtCap = this.isDebtWithTotal() ? total : null;
    const occurrences: Occurrence[] = [];
    let paidSoFar = 0;
    for (
      let month = startMonth;
      month <= until && (debtCap === null || paidSoFar < debtCap);
      month = YearMonths.plusMonths(month, 1)
    ) {
      const occurrence = this.occurrenceAt(month, debtCap, paidSoFar);
      if (!occurrence) continue;
      paidSoFar += occurrence.effective;
      occurrences.push(occurrence);
    }
    return this.numbered(occurrences, debtCap !== null && paidSoFar >= debtCap);
  }

  private occurrenceAt(
    month: YearMonth,
    debtCap: Cents | null,
    paidSoFar: Cents,
  ): Occurrence | null {
    const planned = this.plannedFor(month);
    const payment = this._payments.find((item) => item.month === month) ?? null;
    if (!planned && !payment) return null;
    const plan = planned ?? NOTHING_PLANNED;
    const remaining = debtCap === null ? Infinity : debtCap - paidSoFar;
    const plannedAmount = Math.min(plan.amount, remaining);
    return {
      month,
      planned: plannedAmount,
      certainty: payment ? 'CONFIRMED' : plan.certainty,
      note: plan.note,
      payment,
      effective: payment ? payment.amount : plannedAmount,
      installment: null,
      last: false,
    };
  }

  private numbered(occurrences: Occurrence[], paidOff: boolean): Occurrence[] {
    const { endMonth, category } = this._details;
    const finite = paidOff || endMonth !== null;
    const count = finite ? occurrences.length : null;
    return occurrences.map((occurrence, index) => ({
      ...occurrence,
      installment:
        category === 'LOAN' ? { number: index + 1, total: count } : null,
      last: finite && index === occurrences.length - 1,
    }));
  }

  private isDebtWithTotal(): boolean {
    return this._details.category === 'LOAN' && this._details.total !== null;
  }

  private changeAt(month: YearMonth): CommitmentChange | undefined {
    return this._changes.findLast((change) => change.fromMonth <= month);
  }

  /** Changes from the start on: the latest one before the start moves to it. */
  private changesFrom(startMonth: YearMonth): CommitmentChange[] {
    const before = this._changes.filter((item) => item.fromMonth <= startMonth);
    const after = this._changes.filter((item) => item.fromMonth > startMonth);
    const first = before.at(-1) ?? this._changes[0];
    return [{ ...first, fromMonth: startMonth }, ...after];
  }

  private firstOpenMonth(lock: MonthLock): YearMonth {
    const start = this._details.startMonth;
    if (!lock.closedThrough || lock.closedThrough < start) return start;
    return YearMonths.plusMonths(lock.closedThrough, 1);
  }

  /** RN-PLN-02: an end month that makes the installments add up to more than the debt. */
  private assertWithinTotal(): void {
    const { total, endMonth, category, name } = this._details;
    if (category !== 'LOAN' || total === null || endMonth === null) return;
    let planned = 0;
    for (
      let month = this._details.startMonth;
      month <= endMonth;
      month = YearMonths.plusMonths(month, 1)
    ) {
      planned += this.plannedFor(month)?.amount ?? 0;
    }
    if (planned > total) throw new InstallmentsExceedDebtError(name);
  }

  private static validDetails(details: CommitmentDetails): CommitmentDetails {
    const valid: CommitmentDetails = {
      name: Require.text(details.name, 'name', 120),
      category: Require.present(details.category, 'category'),
      dueDay: Commitment.validDay(details.dueDay),
      startMonth: Require.present(details.startMonth, 'startMonth'),
      endMonth: details.endMonth ?? null,
      total: Money.optionalPositive(details.total, 'total'),
      cardId: details.cardId ?? null,
      notes: Require.optionalText(details.notes, 'notes', 500),
    };
    if (valid.endMonth !== null && valid.endMonth < valid.startMonth) {
      throw new InvalidArgumentError(
        'o último mês não pode ser anterior ao primeiro',
      );
    }
    if (valid.total !== null && valid.category !== 'LOAN') {
      throw new InvalidArgumentError('só empréstimos e dívidas têm total');
    }
    if (valid.cardId !== null && INCOME_CATEGORIES.includes(valid.category)) {
      throw new InvalidArgumentError('receita não é cobrada em cartão');
    }
    return valid;
  }

  private static validDay(day: number | null | undefined): number | null {
    if (day == null) return null;
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new InvalidArgumentError('dueDay deve estar entre 1 e 31');
    }
    return day;
  }

  private static validChange(
    input: ChangeInput,
    fromMonth: YearMonth,
  ): CommitmentChange {
    return {
      fromMonth,
      amount: Money.positive(input.amount, 'amount'),
      active: input.active,
      certainty: Require.present(input.certainty, 'certainty'),
      note: Require.optionalText(input.note, 'note', 300),
    };
  }

  private static sorted<T, K extends keyof T>(items: T[], key: K): T[] {
    return [...items].sort((left, right) =>
      String(left[key]).localeCompare(String(right[key])),
    );
  }
}

function minMonth(left: YearMonth, right: YearMonth): YearMonth {
  return left < right ? left : right;
}

/** The earlier of two ends; an open end counts as later than any month. */
function earliestEnd(
  left: YearMonth | null,
  right: YearMonth | null,
): YearMonth {
  if (left === null) return right as YearMonth;
  if (right === null) return left;
  return minMonth(left, right);
}

/** Months between two months, both included, as a count. */
export function monthCount(from: YearMonth, to: YearMonth): number {
  return monthDiff(from, to) + 1;
}
