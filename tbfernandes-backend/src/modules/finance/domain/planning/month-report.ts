import { IsoDate, Require, YearMonth } from '../../../../common/domain';
import { Cents } from '../money';
import { Direction } from './commitment';
import { Certainty } from './plan-types';
import {
  MonthProjection,
  ProjectionLine,
  Risk,
} from './projection/projection.types';

export interface SnapshotLine {
  key: string;
  name: string;
  direction: Direction;
  amount: Cents;
  certainty: Certainty;
}

/**
 * The plan of a month as it was when the month opened, kept to compare planned with actual
 * after the plan changes (RF-PLN-06).
 */
export class MonthSnapshot {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    readonly month: YearMonth,
    readonly takenOn: IsoDate,
    readonly lines: SnapshotLine[],
  ) {}

  static take(
    id: string,
    ownerId: string,
    projection: MonthProjection,
    today: IsoDate,
  ): MonthSnapshot {
    return new MonthSnapshot(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      projection.month,
      today,
      projection.lines
        .filter((line) => line.counted)
        .map((line) => ({
          key: line.key,
          name: line.name,
          direction: line.direction,
          amount: line.planned,
          certainty: line.certainty,
        })),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    month: YearMonth,
    takenOn: IsoDate,
    lines: SnapshotLine[],
  ): MonthSnapshot {
    return new MonthSnapshot(id, ownerId, month, takenOn, lines);
  }
}

export interface LineChange {
  key: string;
  name: string;
  previous: Cents;
  current: Cents;
}

export interface PlannedVsActual {
  key: string;
  name: string;
  direction: Direction;
  planned: Cents;
  actual: Cents | null;
}

export interface MonthReport {
  month: YearMonth;
  plannedOn: IsoDate | null;
  income: Cents;
  expenses: Cents;
  toPay: Cents;
  balance: Cents;
  availableToSave: Cents;
  risk: Risk;
  increased: LineChange[];
  decreased: LineChange[];
  started: { name: string; amount: Cents }[];
  freed: { name: string; amount: Cents }[];
  comparison: PlannedVsActual[];
  planned: { income: Cents; expenses: Cents };
  actual: { income: Cents; expenses: Cents };
  warnings: string[];
}

/** The month at a glance: what to receive, pay and save, and what changed (RF-PLN-06). */
export function monthReport(
  current: MonthProjection,
  previous: MonthProjection,
  snapshot: MonthSnapshot | null,
): MonthReport {
  const counted = (projection: MonthProjection) =>
    projection.lines.filter((line) => line.counted);
  const changes = lineChanges(counted(previous), counted(current));
  const comparison = plannedVsActual(counted(current), snapshot);
  const total = (
    direction: Direction,
    pick: (item: PlannedVsActual) => Cents,
  ) =>
    comparison
      .filter((item) => item.direction === direction)
      .reduce((sum, item) => sum + pick(item), 0);
  return {
    month: current.month,
    plannedOn: snapshot?.takenOn ?? null,
    income: current.income.total,
    expenses: current.expenses.total,
    toPay: current.expenses.toPay,
    balance: current.balance,
    availableToSave: current.availableToSave,
    risk: current.risk,
    ...changes,
    freed: current.freed,
    comparison,
    planned: {
      income: total('INCOME', (item) => item.planned),
      expenses: total('EXPENSE', (item) => item.planned),
    },
    actual: {
      income: total('INCOME', (item) => item.actual ?? 0),
      expenses: total('EXPENSE', (item) => item.actual ?? 0),
    },
    warnings: current.warnings,
  };
}

function lineChanges(previous: ProjectionLine[], current: ProjectionLine[]) {
  const before = new Map(previous.map((line) => [line.key, line]));
  const increased: LineChange[] = [];
  const decreased: LineChange[] = [];
  const started: { name: string; amount: Cents }[] = [];
  for (const line of current) {
    const old = before.get(line.key);
    if (!old) {
      if (line.amount > 0)
        started.push({ name: line.name, amount: line.amount });
      continue;
    }
    const change = {
      key: line.key,
      name: line.name,
      previous: old.amount,
      current: line.amount,
    };
    if (line.amount > old.amount) increased.push(change);
    if (line.amount < old.amount) decreased.push(change);
  }
  return { increased, decreased, started };
}

function plannedVsActual(
  current: ProjectionLine[],
  snapshot: MonthSnapshot | null,
): PlannedVsActual[] {
  const plannedByKey = new Map(
    (snapshot?.lines ?? []).map((line) => [line.key, line]),
  );
  const rows = current.map((line) => ({
    key: line.key,
    name: line.name,
    direction: line.direction,
    planned: snapshot
      ? (plannedByKey.get(line.key)?.amount ?? 0)
      : line.planned,
    actual: line.paid,
  }));
  const currentKeys = new Set(current.map((line) => line.key));
  const dropped = (snapshot?.lines ?? [])
    .filter((line) => !currentKeys.has(line.key))
    .map((line) => ({ ...line, planned: line.amount, actual: null }));
  return [
    ...rows,
    ...dropped.map(({ key, name, direction, planned, actual }) => ({
      key,
      name,
      direction,
      planned,
      actual,
    })),
  ];
}
