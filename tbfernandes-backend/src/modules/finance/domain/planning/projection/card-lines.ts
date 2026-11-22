import { YearMonth, YearMonths } from '../../../../../common/domain';
import { Cents } from '../../money';
import { normalizeTitle, parseInstallment } from '../card-csv';
import {
  CardPurchase,
  CardStatement,
  CreditCard,
  purchaseInstallment,
  purchaseInstallmentAt,
} from '../credit-card';
import { Certainty, dayOfMonth, monthDiff } from '../plan-types';
import { joinNotes } from './commitment-lines';
import { LineItem, ProjectionLine } from './projection.types';

const INSTALLMENT_SUFFIX = /\s*-\s*(?:parcela\s+)?\d{1,3}\/\d{1,3}\s*$/i;

interface Series {
  label: string;
  amount: Cents;
  total: number;
  firstMonth: YearMonth;
  /** The latest statement that showed this series: inference starts after it. */
  seenUntil: YearMonth;
}

export interface CardMonth {
  lines: ProjectionLine[];
  warnings: string[];
}

/**
 * A card in a month. An imported statement is the whole truth for its month. Without one,
 * the month is the future installments seen in imported statements, the installment
 * purchases registered on the card and the monthly estimate, each shown on its own.
 */
export function cardMonth(card: CreditCard, month: YearMonth): CardMonth {
  const statement = card.statementOf(month);
  if (statement) {
    return {
      lines: [statementLine(card, statement)],
      warnings: missingPurchases(card, month),
    };
  }
  const lines = card.purchases
    .map((purchase) => purchaseLine(card, purchase, month))
    .filter((line): line is ProjectionLine => line !== null);
  const rest = unknownStatementLine(card, month);
  return { lines: rest ? [rest, ...lines] : lines, warnings: [] };
}

function statementLine(
  card: CreditCard,
  statement: CardStatement,
): ProjectionLine {
  const imported = statement.source === 'IMPORTED';
  return {
    ...baseLine(card, statement.month),
    dueDate: statement.dueDate,
    amount: statement.paidAmount ?? statement.total,
    planned: statement.total,
    certainty: statement.certainty,
    note: imported ? 'fatura importada' : 'fatura lançada à mão',
    paid: statement.paidAmount,
    paidOn: statement.paidOn,
    payable: true,
    items: card.transactionsOf(statement.month).map((transaction) => ({
      kind: 'TRANSACTION',
      label: transaction.title,
      amount: transaction.amount,
      date: transaction.date,
    })),
  };
}

/** Inferred installments plus the estimate; 0 and unknown when the card has nothing known. */
function unknownStatementLine(
  card: CreditCard,
  month: YearMonth,
): ProjectionLine | null {
  const items = inferredInstallments(card, month);
  const { monthlyEstimate: estimate, estimateFrom } = card.details;
  if (estimate !== null && (estimateFrom === null || month >= estimateFrom)) {
    items.push({
      kind: 'ESTIMATE',
      label: 'Previsão mensal',
      amount: estimate,
      date: null,
    });
  }
  const hasHistory = card.statements.some((item) => item.month < month);
  if (items.length === 0 && !hasHistory) return null;
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  const certainty: Certainty = items.length ? 'ESTIMATED' : 'UNKNOWN';
  return {
    ...baseLine(card, month),
    amount,
    planned: amount,
    certainty,
    note: unknownNote(items),
    items,
  };
}

function unknownNote(items: LineItem[]): string {
  if (items.length === 0)
    return 'sem lançamentos conhecidos (não quer dizer fatura zerada)';
  return (
    joinNotes(
      items.some((item) => item.kind === 'INFERRED')
        ? 'parcelas futuras inferidas de faturas importadas'
        : null,
      items.some((item) => item.kind === 'ESTIMATE') ? 'previsão mensal' : null,
    ) ?? ''
  );
}

function purchaseLine(
  card: CreditCard,
  purchase: CardPurchase,
  month: YearMonth,
): ProjectionLine | null {
  const number = purchaseInstallmentAt(purchase, month);
  if (number === null) return null;
  const amount = purchaseInstallment(purchase, number);
  return {
    ...baseLine(card, month),
    key: `purchase:${purchase.id}`,
    source: 'PURCHASE',
    sourceId: purchase.id,
    name: purchase.description,
    amount,
    planned: amount,
    certainty: 'ESTIMATED',
    note: `no ${card.details.name}, fatura ainda não importada`,
    installment: { number, total: purchase.installments },
    last: number === purchase.installments,
  };
}

function baseLine(card: CreditCard, month: YearMonth): ProjectionLine {
  return {
    key: `card:${card.id}`,
    source: 'CARD',
    sourceId: card.id,
    name: card.details.name,
    group: 'CARD',
    category: null,
    direction: 'EXPENSE',
    dueDate: dayOfMonth(month, card.details.dueDay),
    amount: 0,
    planned: 0,
    certainty: 'UNKNOWN',
    note: null,
    paid: null,
    paidOn: null,
    counted: true,
    installment: null,
    last: false,
    cardId: card.id,
    payable: false,
    items: [],
  };
}

/** Installments still to come of purchases seen in imported statements, for a month without one. */
export function inferredInstallments(
  card: CreditCard,
  month: YearMonth,
): LineItem[] {
  return [...seriesOf(card).values()].flatMap((series) => {
    const number = monthDiff(series.firstMonth, month) + 1;
    if (month <= series.seenUntil || number < 1 || number > series.total) {
      return [];
    }
    return [
      {
        kind: 'INFERRED' as const,
        label: `${series.label} - ${number}/${series.total}`,
        amount: series.amount,
        date: null,
      },
    ];
  });
}

function seriesOf(card: CreditCard): Map<string, Series> {
  const series = new Map<string, Series>();
  for (const transaction of card.transactions) {
    const installment = parseInstallment(transaction.title);
    if (!installment) continue;
    const firstMonth = YearMonths.plusMonths(
      transaction.statementMonth,
      1 - installment.number,
    );
    const key = [
      installment.base,
      transaction.amount,
      installment.total,
      firstMonth,
    ].join('|');
    const current = series.get(key);
    series.set(key, {
      label: transaction.title.replace(INSTALLMENT_SUFFIX, ''),
      amount: transaction.amount,
      total: installment.total,
      firstMonth,
      seenUntil:
        current && current.seenUntil > transaction.statementMonth
          ? current.seenUntil
          : transaction.statementMonth,
    });
  }
  return series;
}

/** RN-PLN-05: a registered purchase that the imported statement of its month does not show. */
function missingPurchases(card: CreditCard, month: YearMonth): string[] {
  if (!card.isImported(month)) return [];
  const transactions = card.transactionsOf(month);
  return card.purchases.flatMap((purchase) => {
    const number = purchaseInstallmentAt(purchase, month);
    if (number === null) return [];
    const amount = purchaseInstallment(purchase, number);
    const found = transactions.some(
      (transaction) =>
        Math.abs(transaction.amount - amount) <= 1 ||
        normalizeTitle(transaction.title).includes(
          normalizeTitle(purchase.description),
        ),
    );
    return found
      ? []
      : [
          `A parcela ${number}/${purchase.installments} de "${purchase.description}" não aparece na fatura importada do ${card.details.name}; ela não foi somada de novo.`,
        ];
  });
}
