import {
  CardDetails,
  CardPurchase,
  Cents,
  Commitment,
  CommitmentDetails,
  ExpenseBreakdown,
  CreditCard,
  FundDetails,
  GoalStatus,
  MonthProjection,
  MonthReport,
  Money,
  MovementInput,
  PlanningSettings,
  PlanOverview,
  ProjectionLine,
  PurchaseInput,
  ReserveFund,
  ScenarioOperation,
  SettingsDetails,
  Simulation,
} from '../../domain';
import type {
  OperationRequest,
  ValidCardPurchaseRequest,
  ValidCardRequest,
  ValidChangeRequest,
  ValidCommitmentRequest,
  ValidCreateCommitmentRequest,
  ValidFundRequest,
  ValidMovementRequest,
  ValidSettingsRequest,
} from '../planning.request';

/** JSON numbers in reais ↔ cents. */
const toCents = (value: number) => Money.cents(value);
const optionalCents = (value: number | null | undefined) =>
  value == null ? null : Money.cents(value);
const reais = (cents: Cents) => Money.toNumber(cents);
const optionalReais = (cents: Cents | null) =>
  cents === null ? null : Money.toNumber(cents);
const lower = <T extends string | null>(value: T) =>
  (value === null ? null : value.toLowerCase()) as T;

export const PlanningRequestMapper = {
  commitmentDetails(body: ValidCommitmentRequest): CommitmentDetails {
    return { ...body, total: optionalCents(body.total) };
  },

  firstAmount(body: ValidCreateCommitmentRequest) {
    return {
      amount: toCents(body.amount),
      certainty: body.certainty,
      note: body.note,
    };
  },

  change(body: ValidChangeRequest) {
    return {
      amount: toCents(body.amount),
      active: body.active,
      certainty: body.certainty,
      note: body.note,
    };
  },

  cardDetails(body: ValidCardRequest): CardDetails {
    return { ...body, monthlyEstimate: optionalCents(body.monthlyEstimate) };
  },

  purchase(body: ValidCardPurchaseRequest): PurchaseInput {
    return {
      ...body,
      total: toCents(body.total),
      installmentAmount: optionalCents(body.installmentAmount),
    };
  },

  fundDetails(body: ValidFundRequest): FundDetails {
    return {
      ...body,
      target: optionalCents(body.target),
      expectedContribution: toCents(body.expectedContribution),
    };
  },

  movement(body: ValidMovementRequest): MovementInput {
    return { ...body, amount: toCents(body.amount) };
  },

  settings(body: ValidSettingsRequest): SettingsDetails {
    return {
      safetyMargin: toCents(body.safetyMargin),
      accountBalance: optionalCents(body.accountBalance),
      accountBalanceOn: body.accountBalanceOn,
      salaryScenarios: body.salaryScenarios.map((scenario) => ({
        label: scenario.label,
        amount: toCents(scenario.amount),
      })),
    };
  },

  /** Joi already checked each operation's shape; here type goes upper case and money to cents. */
  operations(operations: OperationRequest[]): ScenarioOperation[] {
    return operations.map((operation) => {
      const converted: OperationRequest = {
        ...operation,
        type: operation.type.toUpperCase(),
      };
      for (const field of MONEY_FIELDS) {
        const value = operation[field];
        if (typeof value === 'number') converted[field] = toCents(value);
      }
      return converted as unknown as ScenarioOperation;
    });
  },
};

const MONEY_FIELDS = ['amount', 'total', 'installmentAmount'];

export const PlanningResponseMapper = {
  commitment(commitment: Commitment, lastMonth: string | null = null) {
    const details = commitment.details;
    return {
      id: commitment.id,
      ...details,
      category: lower(details.category),
      total: optionalReais(details.total),
      direction: lower(commitment.direction),
      counted: commitment.counted,
      lastMonth: lastMonth ?? commitment.lastMonth(),
      changes: commitment.changes.map((change) => ({
        ...change,
        amount: reais(change.amount),
        certainty: lower(change.certainty),
      })),
      overrides: commitment.overrides.map((override) => ({
        ...override,
        amount: reais(override.amount),
        certainty: lower(override.certainty),
      })),
      payments: commitment.payments.map((payment) => ({
        ...payment,
        amount: reais(payment.amount),
      })),
    };
  },

  card(card: CreditCard) {
    const details = card.details;
    return {
      id: card.id,
      name: details.name,
      scope: lower(details.scope),
      dueDay: details.dueDay,
      monthlyEstimate: optionalReais(details.monthlyEstimate),
      estimateFrom: details.estimateFrom,
      statements: card.statements.map((statement) => ({
        ...statement,
        total: reais(statement.total),
        source: lower(statement.source),
        certainty: lower(statement.certainty),
        paidAmount: optionalReais(statement.paidAmount),
      })),
      transactions: card.transactions.map((transaction) => ({
        ...transaction,
        amount: reais(transaction.amount),
      })),
      purchases: card.purchases.map((purchase) =>
        PlanningResponseMapper.purchase(purchase),
      ),
    };
  },

  purchase(purchase: CardPurchase) {
    return {
      ...purchase,
      total: reais(purchase.total),
      installmentAmount: reais(purchase.installmentAmount),
    };
  },

  fund(fund: ReserveFund) {
    const details = fund.details;
    return {
      id: fund.id,
      ...details,
      kind: lower(details.kind),
      target: optionalReais(details.target),
      expectedContribution: reais(details.expectedContribution),
      balance: reais(fund.balance()),
      potentialBalance: reais(fund.potentialBalance()),
      pending: reais(fund.pending()),
      contributionsReceived: reais(fund.contributionsReceived()),
      movements: fund.movements.map((movement) => ({
        ...movement,
        kind: lower(movement.kind),
        source: lower(movement.source),
        status: lower(movement.status),
        amount: reais(movement.amount),
      })),
    };
  },

  settings(settings: PlanningSettings) {
    const details = settings.details;
    return {
      safetyMargin: reais(details.safetyMargin),
      accountBalance: optionalReais(details.accountBalance),
      accountBalanceOn: details.accountBalanceOn,
      salaryScenarios: details.salaryScenarios.map((scenario) => ({
        label: scenario.label,
        amount: reais(scenario.amount),
      })),
      closedThrough: settings.closedThrough,
    };
  },

  line(line: ProjectionLine) {
    return {
      ...line,
      source: lower(line.source),
      group: lower(line.group),
      category: lower(line.category),
      direction: lower(line.direction),
      certainty: lower(line.certainty),
      amount: reais(line.amount),
      planned: reais(line.planned),
      paid: optionalReais(line.paid),
      items: line.items.map((item) => ({
        ...item,
        kind: lower(item.kind),
        amount: reais(item.amount),
      })),
    };
  },

  month(projection: MonthProjection) {
    return {
      month: projection.month,
      lines: projection.lines.map((line) => PlanningResponseMapper.line(line)),
      income: mapCents(projection.income),
      expenses: {
        ...mapCents(projection.expenses),
        unknownLines: projection.expenses.unknownLines,
      },
      balance: reais(projection.balance),
      safetyMargin: reais(projection.safetyMargin),
      availableToSave: reais(projection.availableToSave),
      reserveTransfers: reais(projection.reserveTransfers),
      accumulated: reais(projection.accumulated),
      accountBalance: optionalReais(projection.accountBalance),
      reserves: mapCents(projection.reserves),
      debt: {
        known: reais(projection.debt.known),
        unknown: projection.debt.unknown,
      },
      freed: projection.freed.map((item) => ({
        ...item,
        amount: reais(item.amount),
      })),
      scenarios: projection.scenarios.map((scenario) => ({
        label: scenario.label,
        salary: reais(scenario.salary),
        balance: reais(scenario.balance),
      })),
      risk: lower(projection.risk),
      warnings: projection.warnings,
    };
  },

  simulation(simulation: Simulation) {
    return {
      base: simulation.base.map((month) => PlanningResponseMapper.month(month)),
      simulated: simulation.simulated.map((month) =>
        PlanningResponseMapper.month(month),
      ),
    };
  },

  goal(goal: GoalStatus) {
    return {
      ...goal,
      target: optionalReais(goal.target),
      reserved: reais(goal.reserved),
      pending: reais(goal.pending),
      contributionsReceived: reais(goal.contributionsReceived),
      expectedContribution: reais(goal.expectedContribution),
      remaining: optionalReais(goal.remaining),
      monthlyNeeded: optionalReais(goal.monthlyNeeded),
      protectedReserves: reais(goal.protectedReserves),
      package: goal.package && {
        ...goal.package,
        total: reais(goal.package.total),
        remainingAmount: reais(goal.package.remainingAmount),
      },
    };
  },

  overview(overview: PlanOverview) {
    return {
      month: overview.month,
      projection: PlanningResponseMapper.month(overview.projection),
      goals: overview.goals.map((goal) => PlanningResponseMapper.goal(goal)),
      nextDue:
        overview.nextDue && PlanningResponseMapper.line(overview.nextDue),
      pendingReserves: reais(overview.pendingReserves),
    };
  },

  expenses(breakdown: ExpenseBreakdown) {
    return {
      month: breakdown.month,
      scope: lower(breakdown.scope),
      items: breakdown.items.map((item) => ({
        ...item,
        source: lower(item.source),
        group: lower(item.group),
        category:
          item.source === 'ENTRY' ? item.category : lower(item.category),
        scope: lower(item.scope),
        status: lower(item.status),
        certainty: lower(item.certainty),
        amount: reais(item.amount),
        planned: reais(item.planned),
        items: item.items.map((part) => ({
          ...part,
          kind: lower(part.kind),
          amount: reais(part.amount),
        })),
      })),
      totals: mapCents(breakdown.totals),
      reconciliation: mapCents(breakdown.reconciliation),
    };
  },

  report(report: MonthReport) {
    const change = (item: { previous: Cents; current: Cents }) => ({
      ...item,
      previous: reais(item.previous),
      current: reais(item.current),
    });
    const named = (item: { amount: Cents }) => ({
      ...item,
      amount: reais(item.amount),
    });
    return {
      month: report.month,
      plannedOn: report.plannedOn,
      income: reais(report.income),
      expenses: reais(report.expenses),
      toPay: reais(report.toPay),
      balance: reais(report.balance),
      availableToSave: reais(report.availableToSave),
      risk: lower(report.risk),
      increased: report.increased.map(change),
      decreased: report.decreased.map(change),
      started: report.started.map(named),
      freed: report.freed.map(named),
      comparison: report.comparison.map((item) => ({
        ...item,
        direction: lower(item.direction),
        planned: reais(item.planned),
        actual: optionalReais(item.actual),
      })),
      planned: mapCents(report.planned),
      actual: mapCents(report.actual),
      warnings: report.warnings,
    };
  },
};

function mapCents<T extends Record<string, number>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, reais(value)]),
  ) as Record<keyof T, number>;
}
