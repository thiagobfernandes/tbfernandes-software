import {
  InvalidArgumentError,
  NotFoundError,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { Cents } from '../money';
import { Commitment, CommitmentCategory } from './commitment';
import { CreditCard, PurchaseInput } from './credit-card';
import { Certainty, MonthLock } from './plan-types';
import { PlanState } from './projection/projection.types';
import { ReserveFund } from './reserve-fund';

export type OneOffCategory = Extract<
  CommitmentCategory,
  'FREELANCE' | 'OTHER_INCOME' | 'EXTRA'
>;

/** A change to try in the simulator. The same operations are applied on confirm (RN-PLN-09). */
export type ScenarioOperation =
  | {
      type: 'SET_MONTH_AMOUNT';
      commitmentId: string;
      month: YearMonth;
      amount: Cents;
      certainty: Certainty;
    }
  | {
      type: 'CHANGE_FROM';
      commitmentId: string;
      fromMonth: YearMonth;
      amount: Cents | null;
      active: boolean | null;
    }
  | { type: 'END_COMMITMENT'; commitmentId: string; month: YearMonth | null }
  | {
      type: 'ADD_ONE_OFF';
      category: OneOffCategory;
      name: string;
      month: YearMonth;
      amount: Cents;
    }
  | {
      type: 'PREPAY_DEBT';
      commitmentId: string;
      month: YearMonth;
      amount: Cents;
    }
  | ({ type: 'ADD_PURCHASE'; cardId: string } & PurchaseInput)
  | ({
      type: 'CHANGE_PURCHASE';
      cardId: string;
      purchaseId: string;
    } & Partial<PurchaseInput>)
  | { type: 'RESERVE_DEPOSIT'; fundId: string; month: YearMonth; amount: Cents }
  | { type: 'SET_CONTRIBUTION'; fundId: string; amount: Cents };

export interface ScenarioContext {
  ownerId: string;
  newId: () => string;
  lock: MonthLock;
}

/** What a scenario changed, so confirming saves exactly these aggregates. */
export interface ScenarioChanges {
  created: Commitment[];
  commitments: Set<Commitment>;
  cards: Set<CreditCard>;
  funds: Set<ReserveFund>;
}

/** Applies the operations to the plan in place. Callers simulate on a fresh copy. */
export function applyScenario(
  state: PlanState,
  operations: ScenarioOperation[],
  context: ScenarioContext,
): ScenarioChanges {
  const changes: ScenarioChanges = {
    created: [],
    commitments: new Set(),
    cards: new Set(),
    funds: new Set(),
  };
  for (const operation of operations) {
    applyOne(state, operation, context, changes);
  }
  return changes;
}

function applyOne(
  state: PlanState,
  operation: ScenarioOperation,
  context: ScenarioContext,
  changes: ScenarioChanges,
): void {
  switch (operation.type) {
    case 'SET_MONTH_AMOUNT':
    case 'CHANGE_FROM':
    case 'END_COMMITMENT':
    case 'PREPAY_DEBT':
      changeCommitment(state, operation, context.lock, changes);
      return;
    case 'ADD_ONE_OFF':
      addOneOff(state, operation, context, changes);
      return;
    case 'ADD_PURCHASE':
    case 'CHANGE_PURCHASE':
      changePurchase(state, operation, context, changes);
      return;
    case 'RESERVE_DEPOSIT':
    case 'SET_CONTRIBUTION':
      changeFund(state, operation, context, changes);
  }
}

type CommitmentOperation = Extract<ScenarioOperation, { commitmentId: string }>;

function changeCommitment(
  state: PlanState,
  operation: CommitmentOperation,
  lock: MonthLock,
  changes: ScenarioChanges,
): void {
  const commitment = findCommitment(state, operation.commitmentId);
  changes.commitments.add(commitment);
  if (operation.type === 'SET_MONTH_AMOUNT') {
    commitment.setOverride(
      {
        month: operation.month,
        amount: operation.amount,
        certainty: operation.certainty,
        note: null,
      },
      lock,
    );
  } else if (operation.type === 'CHANGE_FROM') {
    changeFrom(commitment, operation, lock);
  } else if (operation.type === 'END_COMMITMENT') {
    commitment.endAt(operation.month, lock);
  } else {
    prepay(commitment, operation.month, operation.amount, lock);
  }
}

function changeFrom(
  commitment: Commitment,
  operation: Extract<ScenarioOperation, { type: 'CHANGE_FROM' }>,
  lock: MonthLock,
): void {
  const current =
    commitment.changes.findLast(
      (change) => change.fromMonth <= operation.fromMonth,
    ) ?? commitment.changes[0];
  commitment.changeFrom(
    operation.fromMonth,
    {
      amount: operation.amount ?? current.amount,
      active: operation.active ?? current.active,
      certainty: current.certainty,
      note: current.note,
    },
    lock,
  );
}

/**
 * Pays more of a debt in a month. A debt known only by its end month becomes a debt with a
 * total, so the extra payment shortens it from the end.
 */
function prepay(
  commitment: Commitment,
  month: YearMonth,
  extra: Cents,
  lock: MonthLock,
): void {
  const details = commitment.details;
  if (details.category !== 'LOAN') {
    throw new InvalidArgumentError('só dá para adiantar empréstimos e dívidas');
  }
  if (details.total === null && details.endMonth === null) {
    throw new InvalidArgumentError(
      `"${details.name}" não tem total nem término; informe um deles antes de adiantar`,
    );
  }
  if (details.total === null) {
    const total = commitment
      .schedule(details.endMonth as YearMonth)
      .reduce((sum, occurrence) => sum + occurrence.effective, 0);
    commitment.update({ ...details, total, endMonth: null }, lock);
  }
  const planned = commitment
    .schedule(month)
    .find((item) => item.month === month);
  commitment.setOverride(
    {
      month,
      amount: (planned?.planned ?? 0) + extra,
      certainty: 'ESTIMATED',
      note: 'com adiantamento',
    },
    lock,
  );
}

function addOneOff(
  state: PlanState,
  operation: Extract<ScenarioOperation, { type: 'ADD_ONE_OFF' }>,
  context: ScenarioContext,
  changes: ScenarioChanges,
): void {
  const commitment = Commitment.create(
    context.newId(),
    context.ownerId,
    {
      name: operation.name,
      category: operation.category,
      dueDay: null,
      startMonth: operation.month,
      endMonth: operation.month,
      total: null,
      cardId: null,
      notes: null,
    },
    { amount: operation.amount, certainty: 'ESTIMATED', note: null },
    context.lock,
  );
  state.commitments.push(commitment);
  changes.created.push(commitment);
}

function changePurchase(
  state: PlanState,
  operation: Extract<ScenarioOperation, { cardId: string }>,
  context: ScenarioContext,
  changes: ScenarioChanges,
): void {
  const card = state.cards.find((item) => item.id === operation.cardId);
  if (!card) throw new NotFoundError('O cartão', operation.cardId);
  changes.cards.add(card);
  if (operation.type === 'ADD_PURCHASE') {
    card.addPurchase(context.newId(), purchaseInput(operation), context.lock);
    return;
  }
  card.updatePurchase(
    operation.purchaseId,
    mergedPurchase(card, operation),
    context.lock,
  );
}

function mergedPurchase(
  card: CreditCard,
  operation: Extract<ScenarioOperation, { type: 'CHANGE_PURCHASE' }>,
): PurchaseInput {
  const current = card.purchases.find(
    (item) => item.id === operation.purchaseId,
  );
  if (!current) {
    throw new NotFoundError('A compra parcelada', operation.purchaseId);
  }
  const keptInstallment = current.withInterest
    ? current.installmentAmount
    : null;
  return {
    description: operation.description ?? current.description,
    total: operation.total ?? current.total,
    installments: operation.installments ?? current.installments,
    firstMonth: operation.firstMonth ?? current.firstMonth,
    withInterest: operation.withInterest ?? current.withInterest,
    installmentAmount: operation.installmentAmount ?? keptInstallment,
  };
}

function purchaseInput(input: PurchaseInput): PurchaseInput {
  return {
    description: input.description,
    total: input.total,
    installments: input.installments,
    firstMonth: input.firstMonth,
    withInterest: input.withInterest,
    installmentAmount: input.installmentAmount,
  };
}

function changeFund(
  state: PlanState,
  operation: Extract<ScenarioOperation, { fundId: string }>,
  context: ScenarioContext,
  changes: ScenarioChanges,
): void {
  const fund = state.funds.find((item) => item.id === operation.fundId);
  if (!fund) throw new NotFoundError('A reserva', operation.fundId);
  changes.funds.add(fund);
  if (operation.type === 'SET_CONTRIBUTION') {
    fund.update({ ...fund.details, expectedContribution: operation.amount });
    return;
  }
  fund.addMovement(
    context.newId(),
    {
      date: YearMonths.lastDay(operation.month),
      kind: 'DEPOSIT',
      source: 'ACCOUNT',
      status: 'EXPECTED',
      amount: operation.amount,
      contributor: null,
      note: 'aporte planejado',
    },
    context.lock,
  );
}

function findCommitment(state: PlanState, id: string): Commitment {
  const commitment = state.commitments.find((item) => item.id === id);
  if (!commitment) throw new NotFoundError('O compromisso', id);
  return commitment;
}
