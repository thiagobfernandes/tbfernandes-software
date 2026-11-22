import { Commitment, CommitmentDetails } from '../commitment';
import { CreditCard } from '../credit-card';
import { parseStatementCsv } from '../card-csv';
import { MonthLock } from '../plan-types';
import { PlanningSettings } from '../planning-settings';
import { PlanState } from '../projection/projection.types';
import { ReserveFund } from '../reserve-fund';
import {
  PF_APRIL,
  PF_DECEMBER,
  PF_FEBRUARY,
  PF_JANUARY,
  PF_MARCH,
  PJ_DECEMBER,
  PJ_JANUARY,
} from './statement-fixtures';

export const OWNER = 'owner';
const OPEN = MonthLock.none();

let counter = 0;
export const newId = () => `id-${++counter}`;

function commitment(
  details: Partial<CommitmentDetails> &
    Pick<CommitmentDetails, 'name' | 'category'>,
  amount: number,
  certainty: 'CONFIRMED' | 'ESTIMATED' | 'UNKNOWN' = 'CONFIRMED',
): Commitment {
  return Commitment.create(
    newId(),
    OWNER,
    {
      dueDay: 10,
      startMonth: '2026-12',
      endMonth: null,
      total: null,
      cardId: null,
      notes: null,
      ...details,
    },
    { amount, certainty, note: null },
    OPEN,
  );
}

export function referenceCards() {
  const personal = CreditCard.create('card-pf', OWNER, {
    name: 'Nubank PF',
    scope: 'PERSONAL',
    dueDay: 19,
    monthlyEstimate: null,
    estimateFrom: null,
  });
  const business = CreditCard.create('card-pj', OWNER, {
    name: 'Nubank PJ',
    scope: 'BUSINESS',
    dueDay: 19,
    monthlyEstimate: null,
    estimateFrom: null,
  });
  const other = CreditCard.create('card-other', OWNER, {
    name: 'Outro cartão',
    scope: 'PERSONAL',
    dueDay: 10,
    monthlyEstimate: 20000,
    estimateFrom: '2026-12',
  });
  const imports: [CreditCard, string, string][] = [
    [personal, '2026-12-19', PF_DECEMBER],
    [personal, '2026-12-19', PF_DECEMBER],
    [personal, '2027-01-19', PF_JANUARY],
    [personal, '2027-02-19', PF_FEBRUARY],
    [personal, '2027-03-19', PF_MARCH],
    [personal, '2027-04-19', PF_APRIL],
    [business, '2026-12-19', PJ_DECEMBER],
    [business, '2027-01-19', PJ_JANUARY],
  ];
  for (const [card, dueDate, csv] of imports) {
    card.importStatement(dueDate, parseStatementCsv(csv), newId, OPEN);
  }
  other.addPurchase(
    'trip-package',
    {
      description: 'Pacote da viagem',
      total: 420000,
      installments: 12,
      installmentAmount: null,
      firstMonth: '2026-12',
      withInterest: false,
    },
    OPEN,
  );
  return { personal, business, other };
}

/**
 * The reference scenario: R$ 4.200 package in 12 × R$ 350 from December, a subscription suspended
 * from January, the debt of R$ 4.000 starting in December.
 */
export function referencePlan(): PlanState & {
  salary: Commitment;
  claude: Commitment;
  debt: Commitment;
  loan1: Commitment;
} {
  const { personal, business, other } = referenceCards();
  const salary = commitment(
    { name: 'Salário', category: 'SALARY', dueDay: 5 },
    330000,
    'ESTIMATED',
  );
  const debt = commitment(
    { name: 'Dívida pessoal', category: 'LOAN', total: 400000 },
    50000,
    'ESTIMATED',
  );
  const loan1 = commitment(
    { name: 'Empréstimo 1', category: 'LOAN', endMonth: '2027-02' },
    19400,
  );
  const loan2 = commitment(
    { name: 'Empréstimo 2', category: 'LOAN', endMonth: '2027-02' },
    13400,
  );
  const loan3 = commitment(
    { name: 'Empréstimo 3', category: 'LOAN', endMonth: '2027-01' },
    8300,
  );
  loan3.setOverride(
    { month: '2026-12', amount: 8800, certainty: 'CONFIRMED', note: null },
    OPEN,
  );
  const marketplace = commitment(
    { name: 'Empréstimo 4', category: 'LOAN' },
    7400,
  );
  marketplace.setOverride(
    {
      month: '2026-12',
      amount: 16700,
      certainty: 'ESTIMATED',
      note: 'pendente de confirmação',
    },
    OPEN,
  );
  const gym = commitment({ name: 'Academia', category: 'FIXED' }, 12000);
  const claude = commitment(
    { name: 'Assinatura de IA', category: 'SUBSCRIPTION' },
    11000,
  );
  claude.changeFrom(
    '2027-01',
    { amount: 11000, active: false, certainty: 'CONFIRMED', note: null },
    OPEN,
  );
  const home = commitment(
    { name: 'Ajuda em casa', category: 'FIXED' },
    20000,
    'ESTIMATED',
  );
  const apple = commitment(
    { name: 'Loja de apps', category: 'SUBSCRIPTION', cardId: personal.id },
    1990,
    'UNKNOWN',
  );
  const settings = PlanningSettings.defaults('settings', OWNER);
  settings.update({
    safetyMargin: 0,
    accountBalance: null,
    accountBalanceOn: null,
    salaryScenarios: [
      { label: 'Conservador', amount: 300000 },
      { label: 'Atual', amount: 330000 },
      { label: 'Aumento 1', amount: 360000 },
      { label: 'Aumento 2', amount: 380000 },
      { label: 'Aumento 3', amount: 400000 },
    ],
  });
  const emergency = ReserveFund.create('fund-emergency', OWNER, {
    name: 'Reserva de emergência',
    kind: 'EMERGENCY',
    protected: true,
    target: null,
    targetMonth: null,
    expectedContribution: 0,
    contributorName: null,
    purchaseId: null,
  });
  emergency.addMovement(
    newId(),
    {
      date: '2026-11-21',
      kind: 'DEPOSIT',
      source: 'EXTERNAL',
      status: 'CONFIRMED',
      amount: 140000,
      contributor: null,
      note: 'saldo inicial',
    },
    OPEN,
  );
  emergency.addMovement(
    newId(),
    {
      date: '2026-12-10',
      kind: 'DEPOSIT',
      source: 'EXTERNAL',
      status: 'EXPECTED',
      amount: 30000,
      contributor: null,
      note: 'a receber',
    },
    OPEN,
  );
  const trip = ReserveFund.create('fund-trip', OWNER, {
    name: 'Viagem',
    kind: 'TRAVEL',
    protected: false,
    target: 500000,
    targetMonth: '2027-04',
    expectedContribution: 0,
    contributorName: 'Outra pessoa',
    purchaseId: 'trip-package',
  });
  return {
    settings,
    commitments: [
      salary,
      debt,
      loan1,
      loan2,
      loan3,
      marketplace,
      gym,
      claude,
      home,
      apple,
    ],
    cards: [personal, business, other],
    funds: [emergency, trip],
    salary,
    claude,
    debt,
    loan1,
  };
}
