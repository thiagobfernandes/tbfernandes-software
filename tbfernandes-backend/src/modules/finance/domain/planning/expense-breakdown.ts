import { IsoDate, YearMonth } from '../../../../common/domain';
import { EntryScope, FinanceEntry } from '../entry/finance-entry';
import { Cents } from '../money';
import { Commitment, CommitmentCategory } from './commitment';
import { CreditCard } from './credit-card';
import { Certainty } from './plan-types';
import {
  LineGroup,
  LineItem,
  LineSource,
  MonthProjection,
  ProjectionLine,
} from './projection/projection.types';

/**
 * Where an expense of the month stands (RF-PLN-10):
 * - FORECAST: expected, amount still estimated or unknown;
 * - PENDING: confirmed amount, not paid yet;
 * - PAID: settled;
 * - REALIZED: money that already left, recorded by hand or by the bank;
 * - CANCELLED: suspended from this month on, not owed.
 */
export type ExpenseStatus =
  'FORECAST' | 'PENDING' | 'PAID' | 'REALIZED' | 'CANCELLED';

export type ExpenseSource = LineSource | 'ENTRY';

export interface ExpenseItem {
  key: string;
  source: ExpenseSource;
  sourceId: string;
  name: string;
  /** The plan's group for plan lines; "MANUAL" for entries, whose own category is in `category`. */
  group: LineGroup | 'MANUAL';
  /** Commitment category, or the entry's free-text category. */
  category: string | null;
  scope: EntryScope;
  competence: YearMonth;
  dueDate: IsoDate | null;
  amount: Cents;
  planned: Cents;
  status: ExpenseStatus;
  certainty: Certainty;
  /** False when it is shown but already inside another number (a card subscription, a transfer). */
  counted: boolean;
  /** Why it is not counted, when it is not. */
  excludedReason: string | null;
  installment: { number: number; total: number | null } | null;
  cardId: string | null;
  recurring: boolean;
  /** A card month with a statement, or a commitment: can be paid or deleted for the month. */
  payable: boolean;
  /** What a card line is made of. Shown, never added again. */
  items: LineItem[];
}

export interface ExpenseBreakdown {
  month: YearMonth;
  scope: EntryScope | null;
  items: ExpenseItem[];
  totals: {
    /** Everything owed for the month (competence): plan lines plus money spent outside the plan. */
    total: Cents;
    /** Plan obligations; with no scope filter, equals the projection's expenses (Próximos meses). */
    planned: Cents;
    /** Confirmed or paid plan lines plus entries. */
    realized: Cents;
    /** Still estimated or unknown. */
    forecast: Cents;
    paid: Cents;
    pending: Cents;
    cards: Cents;
    recurring: Cents;
    /** Entries recorded by hand or by the bank, outside the plan. */
    entries: Cents;
  };
  reconciliation: {
    /** The projection's expense total for the month, for every scope. */
    projection: Cents;
    /** Entries left out because they move money without spending it. */
    excludedEntries: Cents;
  };
}

export interface ExpenseBreakdownInput {
  month: YearMonth;
  scope: EntryScope | null;
  projection: MonthProjection;
  commitments: readonly Commitment[];
  cards: readonly CreditCard[];
  /** Entries dated in the month. */
  entries: readonly FinanceEntry[];
}

/** Groups whose lines repeat every month. */
const RECURRING_GROUPS: ReadonlySet<LineGroup> = new Set([
  'LOAN',
  'FIXED',
  'SUBSCRIPTION',
]);

/**
 * Entries that move money between own accounts or pay a card statement: the statement is
 * already in the plan, so counting them would add the same expense twice (RN-PLN-11).
 */
const NOT_AN_EXPENSE =
  /transfer|pagamento d[ae] (fatura|cart)|fatura do cart|credit card payment|card payment|investiment|aplica[cç][aã]o|resgate|reserva/i;

export function isTransferLike(entry: FinanceEntry): boolean {
  const { category, description } = entry.details;
  return NOT_AN_EXPENSE.test(category) || NOT_AN_EXPENSE.test(description);
}

/**
 * Every expense of a month in one list: plan lines (commitments, card statements, installments)
 * and entries recorded outside the plan, each with its status, without counting anything twice.
 */
export function expenseBreakdown(
  input: ExpenseBreakdownInput,
): ExpenseBreakdown {
  const { month, scope, projection } = input;
  const cardScope = new Map(
    input.cards.map((card) => [card.id, card.details.scope]),
  );
  const scopeOf = (cardId: string | null): EntryScope =>
    (cardId && cardScope.get(cardId)) || 'PERSONAL';
  const items = [
    ...projection.lines
      .filter((line) => line.direction === 'EXPENSE')
      .map((line) => planItem(line, month, scopeOf(line.cardId))),
    ...input.commitments
      .filter(
        (commitment) =>
          commitment.direction === 'EXPENSE' && suspendedIn(commitment, month),
      )
      .map((commitment) =>
        cancelledItem(commitment, month, scopeOf(commitment.details.cardId)),
      ),
    ...input.entries
      .filter((entry) => entry.details.kind === 'EXPENSE')
      .map((entry) => entryItem(entry, month)),
  ]
    .filter((item) => scope === null || item.scope === scope)
    .sort(byDueDate);
  return {
    month,
    scope,
    items,
    totals: totalsOf(items),
    reconciliation: {
      projection: projection.expenses.total,
      excludedEntries: sumOf(
        items.filter((item) => item.source === 'ENTRY' && !item.counted),
      ),
    },
  };
}

function planItem(
  line: ProjectionLine,
  month: YearMonth,
  scope: EntryScope,
): ExpenseItem {
  return {
    key: line.key,
    source: line.source,
    sourceId: line.sourceId,
    name: line.name,
    group: line.group,
    category: line.category,
    scope,
    competence: month,
    dueDate: line.dueDate,
    amount: line.amount,
    planned: line.planned,
    status: lineStatus(line.paid, line.certainty),
    certainty: line.paid !== null ? 'CONFIRMED' : line.certainty,
    counted: line.counted,
    excludedReason: line.counted ? null : 'já está dentro da fatura do cartão',
    installment: line.installment,
    cardId: line.cardId,
    recurring: RECURRING_GROUPS.has(line.group),
    payable: line.payable,
    items: line.items,
  };
}

function cancelledItem(
  commitment: Commitment,
  month: YearMonth,
  scope: EntryScope,
): ExpenseItem {
  const { details } = commitment;
  return {
    key: `commitment:${commitment.id}`,
    source: 'COMMITMENT',
    sourceId: commitment.id,
    name: details.name,
    group: groupOf(details.category),
    category: details.category,
    scope,
    competence: month,
    dueDate: null,
    amount: 0,
    planned: 0,
    status: 'CANCELLED',
    certainty: 'CONFIRMED',
    counted: false,
    excludedReason: 'suspenso neste mês',
    installment: null,
    cardId: details.cardId,
    recurring: true,
    payable: false,
    items: [],
  };
}

function entryItem(entry: FinanceEntry, month: YearMonth): ExpenseItem {
  const transfer = isTransferLike(entry);
  const { details } = entry;
  return {
    key: `entry:${entry.id}`,
    source: 'ENTRY',
    sourceId: entry.id,
    name: details.description,
    group: 'MANUAL',
    category: details.category,
    scope: details.scope,
    competence: month,
    dueDate: details.date,
    amount: details.amount,
    planned: details.amount,
    status: 'REALIZED',
    certainty: 'CONFIRMED',
    counted: !transfer,
    excludedReason: transfer
      ? 'transferência ou pagamento de fatura: a fatura já está no plano'
      : null,
    installment: null,
    cardId: null,
    recurring: details.recurring,
    payable: false,
    items: [],
  };
}

const sumOf = (list: ExpenseItem[]) =>
  list.reduce((total, item) => total + item.amount, 0);

function totalsOf(items: ExpenseItem[]): ExpenseBreakdown['totals'] {
  const counted = items.filter((item) => item.counted);
  const plan = counted.filter((item) => item.source !== 'ENTRY');
  const withStatus = (list: ExpenseItem[], ...statuses: ExpenseStatus[]) =>
    sumOf(list.filter((item) => statuses.includes(item.status)));
  return {
    total: sumOf(counted),
    planned: sumOf(plan),
    realized: withStatus(counted, 'PENDING', 'PAID', 'REALIZED'),
    forecast: withStatus(counted, 'FORECAST'),
    paid: withStatus(counted, 'PAID', 'REALIZED'),
    pending: withStatus(plan, 'PENDING', 'FORECAST'),
    cards: sumOf(plan.filter((item) => item.group === 'CARD')),
    recurring: sumOf(counted.filter((item) => item.recurring)),
    entries: sumOf(counted.filter((item) => item.source === 'ENTRY')),
  };
}

function lineStatus(paid: Cents | null, certainty: Certainty): ExpenseStatus {
  if (paid !== null) return 'PAID';
  return certainty === 'CONFIRMED' ? 'PENDING' : 'FORECAST';
}

/** Inside its period, with no amount set for the month, and put on hold by a change. */
function suspendedIn(commitment: Commitment, month: YearMonth): boolean {
  const { startMonth, endMonth } = commitment.details;
  if (month < startMonth || (endMonth !== null && month > endMonth)) {
    return false;
  }
  if (commitment.overrides.some((override) => override.month === month)) {
    return false;
  }
  const change = commitment.changes
    .filter((item) => item.fromMonth <= month)
    .at(-1);
  return change !== undefined && !change.active;
}

function groupOf(category: CommitmentCategory): LineGroup {
  if (category === 'LOAN') return 'LOAN';
  if (category === 'SUBSCRIPTION') return 'SUBSCRIPTION';
  if (category === 'FIXED') return 'FIXED';
  return 'EXTRA';
}

function byDueDate(first: ExpenseItem, second: ExpenseItem): number {
  return (first.dueDate ?? '9999').localeCompare(second.dueDate ?? '9999');
}
