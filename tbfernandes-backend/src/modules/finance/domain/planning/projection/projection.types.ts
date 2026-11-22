import { IsoDate, YearMonth } from '../../../../../common/domain';
import { Cents } from '../../money';
import { Commitment, CommitmentCategory, Direction } from '../commitment';
import { CreditCard } from '../credit-card';
import { Certainty } from '../plan-types';
import { PlanningSettings } from '../planning-settings';
import { ReserveFund } from '../reserve-fund';

/** Everything the projection reads. A scenario is a changed copy of it (RN-PLN-09). */
export interface PlanState {
  settings: PlanningSettings;
  commitments: Commitment[];
  cards: CreditCard[];
  funds: ReserveFund[];
}

export type LineGroup =
  'INCOME' | 'CARD' | 'LOAN' | 'FIXED' | 'SUBSCRIPTION' | 'EXTRA';

export type LineSource = 'COMMITMENT' | 'CARD' | 'PURCHASE';

export type LineItemKind = 'TRANSACTION' | 'INFERRED' | 'ESTIMATE';

/** A part of a card line: a transaction, an inferred installment or the monthly estimate. */
export interface LineItem {
  kind: LineItemKind;
  label: string;
  amount: Cents;
  date: IsoDate | null;
}

export interface ProjectionLine {
  /** Same key in every month for the same thing, so months can be compared line by line. */
  key: string;
  source: LineSource;
  sourceId: string;
  name: string;
  group: LineGroup;
  /** The commitment's category; null for card lines. */
  category: CommitmentCategory | null;
  direction: Direction;
  dueDate: IsoDate | null;
  /** What counts: the payment when there is one, the plan otherwise. */
  amount: Cents;
  planned: Cents;
  certainty: Certainty;
  note: string | null;
  paid: Cents | null;
  paidOn: IsoDate | null;
  /** False for a subscription charged on a card: shown, already inside the statement. */
  counted: boolean;
  installment: { number: number; total: number | null } | null;
  /** The last occurrence: from the next month on, this amount is free. */
  last: boolean;
  cardId: string | null;
  /** Can be marked paid: a commitment, or a card month with a statement to pay. */
  payable: boolean;
  items: LineItem[];
}

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MonthProjection {
  month: YearMonth;
  lines: ProjectionLine[];
  income: { expected: Cents; received: Cents; total: Cents };
  expenses: {
    total: Cents;
    paid: Cents;
    toPay: Cents;
    confirmed: Cents;
    estimated: Cents;
    unknownLines: number;
  };
  /** Income minus expenses of the month. */
  balance: Cents;
  safetyMargin: Cents;
  /** max(0, balance − safety margin). */
  availableToSave: Cents;
  /** Net money moved from the account to the reserves (withdrawals subtract). */
  reserveTransfers: Cents;
  /** Sum of (balance − transfers) since the first projected month. */
  accumulated: Cents;
  /** Checking account at the end of the month; null when its balance was never informed. */
  accountBalance: Cents | null;
  reserves: { confirmed: Cents; potential: Cents };
  debt: { known: Cents; unknown: string[] };
  /** Things that ended last month and how much they free now. */
  freed: { name: string; amount: Cents }[];
  scenarios: { label: string; salary: Cents; balance: Cents }[];
  risk: Risk;
  warnings: string[];
}
