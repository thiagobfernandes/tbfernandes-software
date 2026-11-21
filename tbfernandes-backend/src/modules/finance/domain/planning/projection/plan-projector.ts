import { IsoDate, YearMonth, YearMonths } from '../../../../../common/domain';
import { Cents } from '../../money';
import { normalizeTitle } from '../card-csv';
import { monthsBetween } from '../plan-types';
import { ReserveFund } from '../reserve-fund';
import { cardMonth } from './card-lines';
import { commitmentLine } from './commitment-lines';
import {
  MonthProjection,
  PlanState,
  ProjectionLine,
  Risk,
} from './projection.types';

/** Above this share of estimated or unknown expenses, a month is at least medium risk. */
const UNCERTAIN_SHARE_FOR_RISK = 0.3;

const sum = (lines: ProjectionLine[], pick: (line: ProjectionLine) => Cents) =>
  lines.reduce((total, line) => total + pick(line), 0);

/**
 * The monthly plan, month by month (RF-PLN-01). Money only counts once: card purchases are
 * inside their statement, transfers to a reserve are not expenses, and money still to
 * receive is never available (RN-PLN-05, RN-PLN-08).
 */
export function projectPlan(
  state: PlanState,
  from: YearMonth,
  to: YearMonth,
): MonthProjection[] {
  const months: MonthProjection[] = [];
  let previousLines = monthLines(state, YearMonths.plusMonths(from, -1)).lines;
  let accumulated = 0;
  let account = openingAccount(state, from);
  for (const month of monthsBetween(from, to)) {
    const { lines, warnings } = monthLines(state, month);
    const projection = summarize(state, month, lines, warnings, previousLines);
    accumulated += projection.balance - projection.reserveTransfers;
    account = nextAccount(state, month, lines, account);
    months.push({ ...projection, accumulated, accountBalance: account });
    previousLines = lines;
  }
  return months;
}

export function monthLines(state: PlanState, month: YearMonth) {
  const cardNames = new Map(
    state.cards.map((card) => [card.id, card.details.name]),
  );
  const commitmentLines = state.commitments
    .map((commitment) => commitmentLine(commitment, month, cardNames))
    .filter((line): line is ProjectionLine => line !== null);
  const cards = state.cards.map((card) => cardMonth(card, month));
  const lines = [...commitmentLines, ...cards.flatMap((card) => card.lines)];
  const warnings = [
    ...cards.flatMap((card) => card.warnings),
    ...duplicateWarnings(state, month, commitmentLines),
  ];
  return { lines, warnings };
}

function summarize(
  state: PlanState,
  month: YearMonth,
  lines: ProjectionLine[],
  warnings: string[],
  previousLines: ProjectionLine[],
): Omit<MonthProjection, 'accumulated' | 'accountBalance'> {
  const counted = lines.filter((line) => line.counted);
  const income = counted.filter((line) => line.direction === 'INCOME');
  const expenses = counted.filter((line) => line.direction === 'EXPENSE');
  const incomeTotal = sum(income, (line) => line.amount);
  const expenseTotal = sum(expenses, (line) => line.amount);
  const balance = incomeTotal - expenseTotal;
  const { safetyMargin } = state.settings.details;
  return {
    month,
    lines,
    income: {
      expected: sum(income, (line) => line.planned),
      received: sum(income, (line) => line.paid ?? 0),
      total: incomeTotal,
    },
    expenses: expenseSummary(expenses, expenseTotal),
    balance,
    safetyMargin,
    availableToSave: Math.max(0, balance - safetyMargin),
    reserveTransfers: accountTransfers(state.funds, month),
    reserves: reserveBalances(state.funds, month),
    debt: debtAfter(state, month),
    freed: freedAmounts(previousLines, lines),
    scenarios: salaryScenarios(state, income, balance),
    risk: riskOf(balance, safetyMargin, expenses, expenseTotal),
    warnings,
  };
}

function expenseSummary(expenses: ProjectionLine[], total: Cents) {
  return {
    total,
    paid: sum(expenses, (line) => line.paid ?? 0),
    toPay: sum(expenses, (line) => (line.paid === null ? line.amount : 0)),
    confirmed: sum(expenses, (line) =>
      line.certainty === 'CONFIRMED' ? line.amount : 0,
    ),
    estimated: sum(expenses, (line) =>
      line.certainty === 'ESTIMATED' ? line.amount : 0,
    ),
    unknownLines: expenses.filter((line) => line.certainty === 'UNKNOWN')
      .length,
  };
}

/** The month's balance if the salary were each band instead (bands are never income). */
function salaryScenarios(
  state: PlanState,
  income: ProjectionLine[],
  balance: Cents,
) {
  const salary = sum(
    income.filter((line) => line.category === 'SALARY'),
    (line) => line.amount,
  );
  return state.settings.details.salaryScenarios.map((scenario) => ({
    label: scenario.label,
    salary: scenario.amount,
    balance: balance - salary + scenario.amount,
  }));
}

function riskOf(
  balance: Cents,
  safetyMargin: Cents,
  expenses: ProjectionLine[],
  expenseTotal: Cents,
): Risk {
  if (balance < 0) return 'HIGH';
  const uncertain = sum(expenses, (line) =>
    line.certainty === 'CONFIRMED' ? 0 : line.amount,
  );
  const unknown = expenses.some((line) => line.certainty === 'UNKNOWN');
  const mostlyUncertain =
    expenseTotal > 0 && uncertain / expenseTotal > UNCERTAIN_SHARE_FOR_RISK;
  if (balance < safetyMargin || mostlyUncertain || unknown) return 'MEDIUM';
  return 'LOW';
}

/** Account → reserve deposits minus reserve → account withdrawals dated in the month. */
function accountTransfers(funds: ReserveFund[], month: YearMonth): Cents {
  return funds
    .flatMap((fund) => fund.movements)
    .filter(
      (movement) =>
        movement.source === 'ACCOUNT' && YearMonths.of(movement.date) === month,
    )
    .reduce(
      (total, movement) =>
        total +
        (movement.kind === 'DEPOSIT' ? movement.amount : -movement.amount),
      0,
    );
}

function reserveBalances(funds: ReserveFund[], month: YearMonth) {
  return {
    confirmed: funds.reduce((total, fund) => total + fund.balance(month), 0),
    potential: funds.reduce(
      (total, fund) => total + fund.potentialBalance(month),
      0,
    ),
  };
}

function debtAfter(state: PlanState, month: YearMonth) {
  const loans = state.commitments.filter(
    (commitment) => commitment.details.category === 'LOAN',
  );
  const remaining = loans.map((loan) => ({
    name: loan.details.name,
    amount: loan.remainingAfter(month),
  }));
  return {
    known: remaining.reduce((total, item) => total + (item.amount ?? 0), 0),
    unknown: remaining
      .filter((item) => item.amount === null)
      .map((item) => item.name),
  };
}

function freedAmounts(previous: ProjectionLine[], current: ProjectionLine[]) {
  const stillThere = new Set(current.map((line) => line.key));
  return previous
    .filter((line) => line.last && line.counted && !stillThere.has(line.key))
    .map((line) => ({ name: line.name, amount: line.amount }));
}

/** A commitment paid outside the cards that also shows up inside a card statement. */
function duplicateWarnings(
  state: PlanState,
  month: YearMonth,
  commitmentLines: ProjectionLine[],
): string[] {
  const transactions = state.cards.flatMap((card) =>
    card.isImported(month)
      ? card.transactionsOf(month).map((transaction) => ({ card, transaction }))
      : [],
  );
  return commitmentLines
    .filter((line) => line.counted && line.direction === 'EXPENSE')
    .flatMap((line) => {
      const firstWord = normalizeTitle(line.name).split(' ')[0] ?? '';
      const match = transactions.find(
        ({ transaction }) =>
          transaction.amount === line.amount &&
          normalizeTitle(transaction.title).includes(firstWord),
      );
      return match
        ? [
            `"${line.name}" pode estar contado duas vezes: ${match.transaction.title} está na fatura do ${match.card.details.name}. Se for a mesma cobrança, ligue o compromisso ao cartão.`,
          ]
        : [];
    });
}

/** Account balance before the first projected month, when there is a known balance by then. */
function openingAccount(state: PlanState, from: YearMonth): Cents | null {
  const { accountBalance, accountBalanceOn } = state.settings.details;
  if (accountBalance === null || accountBalanceOn === null) return null;
  const balanceMonth = YearMonths.of(accountBalanceOn);
  if (balanceMonth >= from) return null;
  let account: Cents | null = null;
  for (const month of monthsBetween(
    balanceMonth,
    YearMonths.plusMonths(from, -1),
  )) {
    account = nextAccount(
      state,
      month,
      monthLines(state, month).lines,
      account,
    );
  }
  return account;
}

/**
 * End-of-month account balance. In the month of the informed balance only what is still
 * open after that day moves it; later months move it by everything (RN-PLN-08).
 */
function nextAccount(
  state: PlanState,
  month: YearMonth,
  lines: ProjectionLine[],
  previous: Cents | null,
): Cents | null {
  const { accountBalance, accountBalanceOn } = state.settings.details;
  if (accountBalance === null || accountBalanceOn === null) return null;
  const balanceMonth = YearMonths.of(accountBalanceOn);
  if (month < balanceMonth) return null;
  const isBalanceMonth = month === balanceMonth;
  const start = isBalanceMonth ? accountBalance : (previous ?? accountBalance);
  const counted = lines.filter(
    (line) =>
      line.counted && (!isBalanceMonth || isOpenAfter(line, accountBalanceOn)),
  );
  const flow = sum(counted, (line) =>
    line.direction === 'INCOME' ? line.amount : -line.amount,
  );
  return (
    start +
    flow -
    transfersAfter(state.funds, month, isBalanceMonth ? accountBalanceOn : null)
  );
}

function isOpenAfter(line: ProjectionLine, day: IsoDate): boolean {
  return line.paidOn === null || line.paidOn > day;
}

function transfersAfter(
  funds: ReserveFund[],
  month: YearMonth,
  after: IsoDate | null,
): Cents {
  return funds
    .flatMap((fund) => fund.movements)
    .filter(
      (movement) =>
        movement.source === 'ACCOUNT' &&
        YearMonths.of(movement.date) === month &&
        (after === null || movement.date > after),
    )
    .reduce(
      (total, movement) =>
        total +
        (movement.kind === 'DEPOSIT' ? movement.amount : -movement.amount),
      0,
    );
}
