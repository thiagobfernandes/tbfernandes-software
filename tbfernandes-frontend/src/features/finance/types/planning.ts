import type { EntryScope } from "@/features/finance/types/finance";

/** Amounts are in reais, as the API sends them. */
export type Certainty = "confirmed" | "estimated" | "unknown";

export type CommitmentCategory =
  | "salary"
  | "freelance"
  | "other_income"
  | "loan"
  | "fixed"
  | "subscription"
  | "extra";

export type Commitment = {
  id: string;
  name: string;
  category: CommitmentCategory;
  dueDay: number | null;
  startMonth: string;
  endMonth: string | null;
  total: number | null;
  cardId: string | null;
  notes: string | null;
  direction: "income" | "expense";
  counted: boolean;
  lastMonth: string | null;
  changes: {
    fromMonth: string;
    amount: number;
    active: boolean;
    certainty: Certainty;
    note: string | null;
  }[];
  overrides: {
    month: string;
    amount: number;
    certainty: Certainty;
    note: string | null;
  }[];
  payments: { month: string; amount: number; paidOn: string }[];
};

export type CardStatement = {
  month: string;
  dueDate: string;
  total: number;
  source: "imported" | "manual";
  certainty: Certainty;
  paidAmount: number | null;
  paidOn: string | null;
};

export type CardTransaction = {
  id: string;
  statementMonth: string;
  date: string;
  title: string;
  amount: number;
  installmentNumber: number | null;
  installmentTotal: number | null;
  occurrence: number;
  commitmentId: string | null;
};

export type CardPurchase = {
  id: string;
  description: string;
  total: number;
  installments: number;
  installmentAmount: number;
  firstMonth: string;
  withInterest: boolean;
};

export type CreditCard = {
  id: string;
  name: string;
  scope: EntryScope;
  dueDay: number;
  monthlyEstimate: number | null;
  estimateFrom: string | null;
  statements: CardStatement[];
  transactions: CardTransaction[];
  purchases: CardPurchase[];
};

export type FundKind = "emergency" | "travel" | "goal";

export type ReserveMovement = {
  id: string;
  date: string;
  kind: "deposit" | "withdrawal";
  source: "account" | "external";
  status: "confirmed" | "expected";
  amount: number;
  contributor: string | null;
  note: string | null;
};

export type ReserveFund = {
  id: string;
  name: string;
  kind: FundKind;
  protected: boolean;
  target: number | null;
  targetMonth: string | null;
  expectedContribution: number;
  contributorName: string | null;
  purchaseId: string | null;
  balance: number;
  potentialBalance: number;
  pending: number;
  contributionsReceived: number;
  movements: ReserveMovement[];
};

export type PlanningSettings = {
  safetyMargin: number;
  accountBalance: number | null;
  accountBalanceOn: string | null;
  salaryScenarios: { label: string; amount: number }[];
  closedThrough: string | null;
};

export type LineGroup =
  "income" | "card" | "loan" | "fixed" | "subscription" | "extra";

export type ProjectionLine = {
  key: string;
  source: "commitment" | "card" | "purchase";
  sourceId: string;
  name: string;
  group: LineGroup;
  category: CommitmentCategory | null;
  direction: "income" | "expense";
  dueDate: string | null;
  amount: number;
  planned: number;
  certainty: Certainty;
  note: string | null;
  paid: number | null;
  paidOn: string | null;
  counted: boolean;
  installment: { number: number; total: number | null } | null;
  last: boolean;
  cardId: string | null;
  /** Can be marked paid: a commitment, or a card month with a statement. */
  payable: boolean;
  items: {
    kind: "transaction" | "inferred" | "estimate";
    label: string;
    amount: number;
    date: string | null;
  }[];
};

export type Risk = "low" | "medium" | "high";

export type MonthProjection = {
  month: string;
  lines: ProjectionLine[];
  income: { expected: number; received: number; total: number };
  expenses: {
    total: number;
    paid: number;
    toPay: number;
    confirmed: number;
    estimated: number;
    unknownLines: number;
  };
  balance: number;
  safetyMargin: number;
  availableToSave: number;
  reserveTransfers: number;
  accumulated: number;
  accountBalance: number | null;
  reserves: { confirmed: number; potential: number };
  debt: { known: number; unknown: string[] };
  freed: { name: string; amount: number }[];
  scenarios: { label: string; salary: number; balance: number }[];
  risk: Risk;
  warnings: string[];
};

export type GoalStatus = {
  fundId: string;
  name: string;
  target: number | null;
  targetMonth: string | null;
  reserved: number;
  pending: number;
  contributionsReceived: number;
  expectedContribution: number;
  contributorName: string | null;
  remaining: number | null;
  monthsLeft: number | null;
  monthlyNeeded: number | null;
  projectedMonth: string | null;
  protectedReserves: number;
  package: {
    purchaseId: string;
    description: string;
    cardName: string;
    total: number;
    installments: number;
    firstMonth: string;
    lastMonth: string;
    remainingInstallments: number;
    remainingAmount: number;
  } | null;
};

export type PlanOverview = {
  month: string;
  projection: MonthProjection;
  goals: GoalStatus[];
  nextDue: ProjectionLine | null;
  pendingReserves: number;
};

export type MonthReport = {
  month: string;
  plannedOn: string | null;
  income: number;
  expenses: number;
  toPay: number;
  balance: number;
  availableToSave: number;
  risk: Risk;
  increased: { key: string; name: string; previous: number; current: number }[];
  decreased: { key: string; name: string; previous: number; current: number }[];
  started: { name: string; amount: number }[];
  freed: { name: string; amount: number }[];
  comparison: {
    key: string;
    name: string;
    direction: "income" | "expense";
    planned: number;
    actual: number | null;
  }[];
  planned: { income: number; expenses: number };
  actual: { income: number; expenses: number };
  warnings: string[];
};

/** A change to try in the simulator; same shape the API takes. */
export type ScenarioOperation =
  | {
      type: "set_month_amount";
      commitmentId: string;
      month: string;
      amount: number;
      certainty?: Certainty;
    }
  | {
      type: "change_from";
      commitmentId: string;
      fromMonth: string;
      amount?: number | null;
      active?: boolean | null;
    }
  | { type: "end_commitment"; commitmentId: string; month: string | null }
  | {
      type: "add_one_off";
      category: "freelance" | "other_income" | "extra";
      name: string;
      month: string;
      amount: number;
    }
  | { type: "prepay_debt"; commitmentId: string; month: string; amount: number }
  | {
      type: "add_purchase";
      cardId: string;
      description: string;
      total: number;
      installments: number;
      installmentAmount?: number | null;
      firstMonth: string;
      withInterest: boolean;
    }
  | {
      type: "change_purchase";
      cardId: string;
      purchaseId: string;
      total?: number;
      installments?: number;
      firstMonth?: string;
    }
  | { type: "reserve_deposit"; fundId: string; month: string; amount: number }
  | { type: "set_contribution"; fundId: string; amount: number };

export type Simulation = {
  base: MonthProjection[];
  simulated: MonthProjection[];
};

/** Where an expense of the month stands; see RF-PLN-10. */
export type ExpenseStatus =
  "forecast" | "pending" | "paid" | "realized" | "cancelled";

export type ExpenseItem = {
  key: string;
  source: "commitment" | "card" | "purchase" | "entry";
  sourceId: string;
  name: string;
  /** The plan's group, or "manual" for entries (their category is in `category`). */
  group: LineGroup | "manual";
  category: string | null;
  scope: EntryScope;
  competence: string;
  dueDate: string | null;
  amount: number;
  planned: number;
  status: ExpenseStatus;
  certainty: Certainty;
  counted: boolean;
  excludedReason: string | null;
  installment: { number: number; total: number | null } | null;
  cardId: string | null;
  recurring: boolean;
  payable: boolean;
  items: ProjectionLine["items"];
};

export type ExpenseBreakdown = {
  month: string;
  scope: EntryScope | null;
  items: ExpenseItem[];
  totals: {
    total: number;
    planned: number;
    realized: number;
    forecast: number;
    paid: number;
    pending: number;
    cards: number;
    recurring: number;
    entries: number;
  };
  reconciliation: { projection: number; excludedEntries: number };
};
