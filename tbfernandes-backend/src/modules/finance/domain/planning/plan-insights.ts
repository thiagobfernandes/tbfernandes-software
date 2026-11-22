import { IsoDate, YearMonth, YearMonths } from '../../../../common/domain';
import { Cents } from '../money';
import { CardPurchase, CreditCard, purchaseInstallment } from './credit-card';
import { monthDiff } from './plan-types';
import {
  MonthProjection,
  PlanState,
  ProjectionLine,
} from './projection/projection.types';
import { ReserveFund } from './reserve-fund';

export interface PackageStatus {
  purchaseId: string;
  description: string;
  cardName: string;
  total: Cents;
  installments: number;
  firstMonth: YearMonth;
  lastMonth: YearMonth;
  remainingInstallments: number;
  remainingAmount: Cents;
}

export interface GoalStatus {
  fundId: string;
  name: string;
  target: Cents | null;
  targetMonth: YearMonth | null;
  /** Confirmed money in this fund: the only money the trip can spend. */
  reserved: Cents;
  pending: Cents;
  contributionsReceived: Cents;
  expectedContribution: Cents;
  contributorName: string | null;
  remaining: Cents | null;
  monthsLeft: number | null;
  monthlyNeeded: Cents | null;
  /** First month in which what can be saved covers what is missing; null beyond the horizon. */
  projectedMonth: YearMonth | null;
  package: PackageStatus | null;
  /** Protected reserves (emergency): never counted as money for the goal. */
  protectedReserves: Cents;
}

/** Where a goal fund stands (RF-PLN-04). Only its own confirmed money is spendable. */
export function goalStatus(
  fund: ReserveFund,
  state: PlanState,
  projections: MonthProjection[],
  currentMonth: YearMonth,
): GoalStatus {
  const details = fund.details;
  const reserved = fund.balance();
  const remaining =
    details.target === null ? null : Math.max(0, details.target - reserved);
  const monthsLeft =
    details.targetMonth === null
      ? null
      : Math.max(0, monthDiff(currentMonth, details.targetMonth));
  return {
    fundId: fund.id,
    name: details.name,
    target: details.target,
    targetMonth: details.targetMonth,
    reserved,
    pending: fund.pending(),
    contributionsReceived: fund.contributionsReceived(),
    expectedContribution: details.expectedContribution,
    contributorName: details.contributorName,
    remaining,
    monthsLeft,
    monthlyNeeded: monthlyNeeded(remaining, monthsLeft),
    projectedMonth: projectedMonth(remaining, projections, currentMonth),
    package: packageStatus(state, details.purchaseId, currentMonth),
    protectedReserves: state.funds
      .filter((item) => item.details.protected && item.id !== fund.id)
      .reduce((total, item) => total + item.balance(), 0),
  };
}

function monthlyNeeded(remaining: Cents | null, monthsLeft: number | null) {
  if (remaining === null || monthsLeft === null) return null;
  if (remaining === 0) return 0;
  return Math.ceil(remaining / Math.max(1, monthsLeft));
}

function projectedMonth(
  remaining: Cents | null,
  projections: MonthProjection[],
  currentMonth: YearMonth,
): YearMonth | null {
  if (remaining === null) return null;
  if (remaining === 0) return currentMonth;
  let saved = 0;
  for (const projection of projections) {
    if (projection.month < currentMonth) continue;
    saved += projection.availableToSave;
    if (saved >= remaining) return projection.month;
  }
  return null;
}

function packageStatus(
  state: PlanState,
  purchaseId: string | null,
  currentMonth: YearMonth,
): PackageStatus | null {
  if (purchaseId === null) return null;
  for (const card of state.cards) {
    const purchase = card.purchases.find((item) => item.id === purchaseId);
    if (purchase) return describePackage(card, purchase, currentMonth);
  }
  return null;
}

function describePackage(
  card: CreditCard,
  purchase: CardPurchase,
  currentMonth: YearMonth,
): PackageStatus {
  const remaining: number[] = [];
  for (let number = 1; number <= purchase.installments; number++) {
    const month = YearMonths.plusMonths(purchase.firstMonth, number - 1);
    const paid = card.statementOf(month)?.paidAmount != null;
    if (month > currentMonth || (month === currentMonth && !paid)) {
      remaining.push(number);
    }
  }
  return {
    purchaseId: purchase.id,
    description: purchase.description,
    cardName: card.details.name,
    total: purchase.total,
    installments: purchase.installments,
    firstMonth: purchase.firstMonth,
    lastMonth: YearMonths.plusMonths(
      purchase.firstMonth,
      purchase.installments - 1,
    ),
    remainingInstallments: remaining.length,
    remainingAmount: remaining.reduce(
      (total, number) => total + purchaseInstallment(purchase, number),
      0,
    ),
  };
}

/** The next unpaid bill from a day on, within the projected months. */
export function nextDue(
  projections: MonthProjection[],
  today: IsoDate,
): ProjectionLine | null {
  const open = projections
    .flatMap((projection) => projection.lines)
    .filter(
      (line) =>
        line.counted &&
        line.direction === 'EXPENSE' &&
        line.paid === null &&
        line.amount > 0 &&
        line.dueDate !== null &&
        line.dueDate >= today,
    )
    .sort((left, right) =>
      (left.dueDate as string).localeCompare(right.dueDate as string),
    );
  return open[0] ?? null;
}

/** What the finance overview shows for a month (RF-PLN-05). */
export interface PlanOverview {
  month: YearMonth;
  projection: MonthProjection;
  goals: GoalStatus[];
  nextDue: ProjectionLine | null;
  pendingReserves: Cents;
}

/** The plan as it is next to the plan with a scenario applied (RN-PLN-09). */
export interface Simulation {
  base: MonthProjection[];
  simulated: MonthProjection[];
}
