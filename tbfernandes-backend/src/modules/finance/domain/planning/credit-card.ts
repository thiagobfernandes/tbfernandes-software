import {
  ConflictError,
  InvalidArgumentError,
  IsoDate,
  NotFoundError,
  Require,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { EntryScope } from '../entry/finance-entry';
import { InvalidInstallmentsError } from '../errors';
import { Cents, Money } from '../money';
import { CsvTransaction, normalizeTitle, parseInstallment } from './card-csv';
import { Certainty, MonthLock, dayOfMonth, monthDiff } from './plan-types';

const MAX_INSTALLMENTS = 72;

export type StatementSource = 'IMPORTED' | 'MANUAL';

export interface CardDetails {
  name: string;
  scope: EntryScope;
  dueDay: number;
  /** Expected statement when nothing is known for a month, e.g. a card without exports. */
  monthlyEstimate: Cents | null;
  /** First month the estimate counts; null: every month. */
  estimateFrom: YearMonth | null;
}

/** A statement, by the month it is due in (its competence). */
export interface CardStatement {
  month: YearMonth;
  dueDate: IsoDate;
  total: Cents;
  source: StatementSource;
  certainty: Certainty;
  paidAmount: Cents | null;
  paidOn: IsoDate | null;
}

export interface CardTransaction {
  id: string;
  statementMonth: YearMonth;
  date: IsoDate;
  title: string;
  amount: Cents;
  installmentNumber: number | null;
  installmentTotal: number | null;
  /** Position among identical lines (date, title, amount) of the same statement. */
  occurrence: number;
  /** The subscription this charge belongs to, when classified as one. */
  commitmentId: string | null;
}

export interface CardPurchase {
  id: string;
  description: string;
  total: Cents;
  installments: number;
  installmentAmount: Cents;
  firstMonth: YearMonth;
  withInterest: boolean;
}

export type PurchaseInput = Omit<CardPurchase, 'id' | 'installmentAmount'> & {
  installmentAmount: Cents | null;
};

export interface ImportResult {
  month: YearMonth;
  imported: number;
  skipped: number;
  total: Cents;
}

/** Key that makes a re-imported line a duplicate while two identical purchases stay two. */
export function transactionKey(
  transaction: Pick<
    CardTransaction,
    'statementMonth' | 'date' | 'title' | 'amount' | 'occurrence'
  >,
): string {
  return [
    transaction.statementMonth,
    transaction.date,
    normalizeTitle(transaction.title),
    transaction.amount,
    transaction.occurrence,
  ].join('|');
}

/**
 * A credit card with its statements, their transactions and the installment purchases made
 * on it. An imported statement is the source of truth for its month: transactions and
 * purchases inside it are never added again (RN-PLN-05).
 */
export class CreditCard {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: CardDetails,
    private _statements: CardStatement[],
    private _transactions: CardTransaction[],
    private _purchases: CardPurchase[],
  ) {}

  static create(id: string, ownerId: string, details: CardDetails): CreditCard {
    return new CreditCard(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      CreditCard.validDetails(details),
      [],
      [],
      [],
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: CardDetails,
    statements: CardStatement[],
    transactions: CardTransaction[],
    purchases: CardPurchase[],
  ): CreditCard {
    return new CreditCard(
      id,
      ownerId,
      details,
      [...statements].sort((left, right) =>
        left.month.localeCompare(right.month),
      ),
      transactions,
      purchases,
    );
  }

  get details(): CardDetails {
    return { ...this._details };
  }

  get statements(): CardStatement[] {
    return this._statements.map((statement) => ({ ...statement }));
  }

  get transactions(): CardTransaction[] {
    return this._transactions.map((transaction) => ({ ...transaction }));
  }

  get purchases(): CardPurchase[] {
    return this._purchases.map((purchase) => ({ ...purchase }));
  }

  update(details: CardDetails): void {
    this._details = CreditCard.validDetails(details);
  }

  statementOf(month: YearMonth): CardStatement | undefined {
    return this._statements.find((statement) => statement.month === month);
  }

  transactionsOf(month: YearMonth): CardTransaction[] {
    return this._transactions.filter(
      (transaction) => transaction.statementMonth === month,
    );
  }

  /**
   * Adds the lines of a statement export. Lines already imported are skipped, so importing
   * the same file twice changes nothing (RN-PLN-07).
   */
  importStatement(
    dueDate: IsoDate,
    rows: CsvTransaction[],
    newId: () => string,
    lock: MonthLock,
  ): ImportResult {
    const month = YearMonths.of(Require.present(dueDate, 'dueDate'));
    lock.assertOpen(month);
    const existing = this.statementOf(month);
    if (existing?.source === 'MANUAL') {
      throw new ConflictError(
        'RN-PLN-07',
        `a fatura de ${month} foi lançada à mão; exclua-a antes de importar o CSV`,
      );
    }
    const known = new Set(this._transactions.map(transactionKey));
    const added = numberOccurrences(rows, month)
      .filter((transaction) => !known.has(transactionKey(transaction)))
      .map((transaction) => ({ ...transaction, id: newId() }));
    this._transactions.push(...added);
    const total = this.transactionsOf(month).reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    this.putStatement({
      month,
      dueDate,
      total,
      source: 'IMPORTED',
      certainty: 'CONFIRMED',
      paidAmount: existing?.paidAmount ?? null,
      paidOn: existing?.paidOn ?? null,
    });
    return {
      month,
      imported: added.length,
      skipped: rows.length - added.length,
      total,
    };
  }

  /** A statement typed in by hand, for a card without exports. */
  setStatement(
    month: YearMonth,
    total: Cents,
    certainty: Certainty,
    lock: MonthLock,
  ): void {
    lock.assertOpen(month);
    const existing = this.statementOf(month);
    if (existing?.source === 'IMPORTED') {
      throw new ConflictError(
        'RN-PLN-07',
        `a fatura de ${month} veio de um CSV; importe o arquivo novo em vez de editar o total`,
      );
    }
    if (total < 0) {
      throw new InvalidArgumentError('o total da fatura não pode ser negativo');
    }
    this.putStatement({
      month,
      dueDate: dayOfMonth(month, this._details.dueDay),
      total,
      source: 'MANUAL',
      certainty: Require.present(certainty, 'certainty'),
      paidAmount: existing?.paidAmount ?? null,
      paidOn: existing?.paidOn ?? null,
    });
  }

  removeStatement(month: YearMonth, lock: MonthLock): void {
    lock.assertOpen(month);
    this.requireStatement(month);
    this._statements = this._statements.filter((item) => item.month !== month);
    this._transactions = this._transactions.filter(
      (transaction) => transaction.statementMonth !== month,
    );
  }

  /** Paying the statement is the cash outflow; its purchases were never one (RN-PLN-05). */
  payStatement(
    month: YearMonth,
    payment: { amount: Cents; paidOn: IsoDate } | null,
    lock: MonthLock,
  ): void {
    lock.assertOpen(month);
    const statement = this.requireStatement(month);
    if (payment) Money.positive(payment.amount, 'amount');
    this.putStatement({
      ...statement,
      paidAmount: payment?.amount ?? null,
      paidOn: payment ? Require.present(payment.paidOn, 'paidOn') : null,
    });
  }

  addPurchase(id: string, input: PurchaseInput, lock: MonthLock): CardPurchase {
    const purchase = { id, ...CreditCard.validPurchase(input) };
    lock.assertOpen(purchase.firstMonth);
    this._purchases.push(purchase);
    return { ...purchase };
  }

  updatePurchase(id: string, input: PurchaseInput, lock: MonthLock): void {
    const current = this.requirePurchase(id);
    const valid = CreditCard.validPurchase(input);
    lock.assertOpen(
      valid.firstMonth < current.firstMonth
        ? valid.firstMonth
        : current.firstMonth,
    );
    this._purchases = this._purchases.map((purchase) =>
      purchase.id === id ? { id, ...valid } : purchase,
    );
  }

  removePurchase(id: string, lock: MonthLock): void {
    lock.assertOpen(this.requirePurchase(id).firstMonth);
    this._purchases = this._purchases.filter((purchase) => purchase.id !== id);
  }

  /** Marks a charge as part of a subscription; it stays inside the statement total. */
  classify(transactionId: string, commitmentId: string | null): void {
    const transaction = this._transactions.find(
      (item) => item.id === transactionId,
    );
    if (!transaction) throw new NotFoundError('A transação', transactionId);
    transaction.commitmentId = commitmentId;
  }

  /** Whether the month's statement came from a CSV: it then holds every purchase of the month. */
  isImported(month: YearMonth): boolean {
    return this.statementOf(month)?.source === 'IMPORTED';
  }

  private putStatement(statement: CardStatement): void {
    this._statements = [
      ...this._statements.filter((item) => item.month !== statement.month),
      statement,
    ].sort((left, right) => left.month.localeCompare(right.month));
  }

  private requireStatement(month: YearMonth): CardStatement {
    const statement = this.statementOf(month);
    if (!statement) throw new NotFoundError('A fatura de', month);
    return statement;
  }

  private requirePurchase(id: string): CardPurchase {
    const purchase = this._purchases.find((item) => item.id === id);
    if (!purchase) throw new NotFoundError('A compra parcelada', id);
    return purchase;
  }

  private static validDetails(details: CardDetails): CardDetails {
    const day = details.dueDay;
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new InvalidArgumentError('dueDay deve estar entre 1 e 31');
    }
    return {
      name: Require.text(details.name, 'name', 120),
      scope: Require.present(details.scope, 'scope'),
      dueDay: day,
      monthlyEstimate: Money.optionalPositive(
        details.monthlyEstimate,
        'monthlyEstimate',
      ),
      estimateFrom: details.estimateFrom ?? null,
    };
  }

  /** RN-PLN-03: interest-free installments add up to the total; with interest, never less. */
  private static validPurchase(input: PurchaseInput): Omit<CardPurchase, 'id'> {
    const total = Money.positive(input.total, 'total');
    const count = input.installments;
    if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
      throw new InvalidInstallmentsError(
        `o número de parcelas deve estar entre 1 e ${MAX_INSTALLMENTS}`,
      );
    }
    const installmentAmount = input.withInterest
      ? CreditCard.interestInstallment(input.installmentAmount, total, count)
      : CreditCard.interestFreeInstallment(
          input.installmentAmount,
          total,
          count,
        );
    return {
      description: Require.text(input.description, 'description', 200),
      total,
      installments: count,
      installmentAmount,
      firstMonth: Require.present(input.firstMonth, 'firstMonth'),
      withInterest: input.withInterest,
    };
  }

  private static interestInstallment(
    amount: Cents | null,
    total: Cents,
    count: number,
  ): Cents {
    const installment = Money.positive(amount, 'installmentAmount');
    if (installment * count < total) {
      throw new InvalidInstallmentsError(
        'com juros, as parcelas não podem somar menos que o total',
      );
    }
    return installment;
  }

  private static interestFreeInstallment(
    amount: Cents | null,
    total: Cents,
    count: number,
  ): Cents {
    const base = Math.floor(total / count);
    if (amount != null && Math.abs(amount * count - total) >= count) {
      throw new InvalidInstallmentsError(
        'sem juros, as parcelas precisam somar o total da compra',
      );
    }
    return base;
  }
}

/** Installment `number` (1-based) of a purchase: the cents left over go to the first one. */
export function purchaseInstallment(
  purchase: CardPurchase,
  number: number,
): Cents {
  if (purchase.withInterest) return purchase.installmentAmount;
  const base = Math.floor(purchase.total / purchase.installments);
  const remainder = purchase.total - base * purchase.installments;
  return number === 1 ? base + remainder : base;
}

/** Which installment of a purchase falls in a month, or null when none does. */
export function purchaseInstallmentAt(
  purchase: CardPurchase,
  month: YearMonth,
): number | null {
  const number = monthDiff(purchase.firstMonth, month) + 1;
  return number >= 1 && number <= purchase.installments ? number : null;
}

function numberOccurrences(
  rows: CsvTransaction[],
  month: YearMonth,
): Omit<CardTransaction, 'id'>[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const sameLine = [row.date, normalizeTitle(row.title), row.amount].join(
      '|',
    );
    const occurrence = (seen.get(sameLine) ?? 0) + 1;
    seen.set(sameLine, occurrence);
    const installment = parseInstallment(row.title);
    return {
      statementMonth: month,
      date: row.date,
      title: Require.text(row.title, 'title', 300),
      amount: row.amount,
      installmentNumber: installment?.number ?? null,
      installmentTotal: installment?.total ?? null,
      occurrence,
      commitmentId: null,
    };
  });
}
