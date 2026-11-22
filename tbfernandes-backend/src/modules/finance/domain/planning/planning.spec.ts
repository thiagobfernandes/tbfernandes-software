import { ConflictError } from '../../../../common/domain';
import {
  ClosedMonthError,
  InstallmentsExceedDebtError,
  InvalidInstallmentsError,
} from '../errors';
import { parseInstallment, parseStatementCsv } from './card-csv';
import { Commitment } from './commitment';
import { CreditCard, purchaseInstallment } from './credit-card';
import { MonthSnapshot, monthReport } from './month-report';
import { goalStatus } from './plan-insights';
import { MonthLock } from './plan-types';
import { projectPlan } from './projection/plan-projector';
import { MonthProjection, ProjectionLine } from './projection/projection.types';
import { applyScenario } from './scenario';
import { OWNER, newId, referencePlan } from './testing/reference-plan';
import { PF_DECEMBER, PJ_JANUARY } from './testing/statement-fixtures';

const OPEN = MonthLock.none();

const line = (
  projection: MonthProjection,
  name: string,
): ProjectionLine | undefined =>
  projection.lines.find((item) => item.name === name);

const amountOf = (projection: MonthProjection, name: string) =>
  line(projection, name)?.amount ?? 0;

describe('Statement CSV', () => {
  it('reads Brazilian amounts, quoted cells and installments', () => {
    const rows = parseStatementCsv(PF_DECEMBER);
    expect(rows).toHaveLength(18);
    expect(rows[0]).toEqual({
      date: '2026-11-21',
      title: 'Pix no Crédito - Pessoa A - 1/2',
      amount: 4088,
    });
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(86199);
    expect(
      parseStatementCsv('date,title,amount\n2026-01-01,Loja,"1.234,56"\n')[0]
        .amount,
    ).toBe(123456);
    expect(parseInstallment('Loja Online - Parcela 2/2')).toEqual({
      base: 'loja online',
      number: 2,
      total: 2,
    });
    expect(parseInstallment('Mercado Brasil')).toBeNull();
  });

  it('refuses a file without the expected columns', () => {
    expect(() => parseStatementCsv('data,descricao,valor\n')).toThrow(
      'coluna "date"',
    );
  });
});

describe('Statement import', () => {
  const card = () =>
    CreditCard.create('card', OWNER, {
      name: 'Nubank PF',
      scope: 'PERSONAL',
      dueDay: 19,
      monthlyEstimate: null,
      estimateFrom: null,
    });

  it('does not duplicate a statement imported twice', () => {
    const personal = card();
    const first = personal.importStatement(
      '2026-12-19',
      parseStatementCsv(PF_DECEMBER),
      newId,
      OPEN,
    );
    const second = personal.importStatement(
      '2026-12-19',
      parseStatementCsv(PF_DECEMBER),
      newId,
      OPEN,
    );
    expect(first).toMatchObject({
      month: '2026-12',
      imported: 18,
      skipped: 0,
      total: 86199,
    });
    expect(second).toMatchObject({ imported: 0, skipped: 18, total: 86199 });
    expect(personal.transactionsOf('2026-12')).toHaveLength(18);
  });

  it('keeps identical purchases that really happened twice', () => {
    const personal = card();
    const csv =
      'date,title,amount\n2026-11-12,Cafe,"7,00"\n2026-11-12,Cafe,"7,00"\n';
    personal.importStatement('2026-12-19', parseStatementCsv(csv), newId, OPEN);
    personal.importStatement('2026-12-19', parseStatementCsv(csv), newId, OPEN);
    expect(personal.transactionsOf('2026-12')).toHaveLength(2);
    expect(personal.statementOf('2026-12')?.total).toBe(1400);
  });

  it('refuses imports and statements in closed months', () => {
    const personal = card();
    expect(() =>
      personal.importStatement(
        '2026-12-19',
        parseStatementCsv(PF_DECEMBER),
        newId,
        MonthLock.through('2026-12'),
      ),
    ).toThrow(ClosedMonthError);
  });

  it('does not let a typed total replace an imported statement', () => {
    const personal = card();
    personal.importStatement(
      '2026-12-19',
      parseStatementCsv(PF_DECEMBER),
      newId,
      OPEN,
    );
    expect(() =>
      personal.setStatement('2026-12', 1000, 'CONFIRMED', OPEN),
    ).toThrow(ConflictError);
  });
});

describe('Installment purchases', () => {
  const card = CreditCard.create('card', OWNER, {
    name: 'Cartão',
    scope: 'PERSONAL',
    dueDay: 10,
    monthlyEstimate: null,
    estimateFrom: null,
  });

  it('spreads an interest-free purchase with the leftover cents on the first installment', () => {
    const purchase = card.addPurchase(
      'p1',
      {
        description: 'TV',
        total: 100000,
        installments: 3,
        installmentAmount: null,
        firstMonth: '2027-01',
        withInterest: false,
      },
      OPEN,
    );
    expect(
      [1, 2, 3].map((number) => purchaseInstallment(purchase, number)),
    ).toEqual([33334, 33333, 33333]);
  });

  it('checks installments with and without interest', () => {
    expect(() =>
      card.addPurchase(
        'p2',
        {
          description: 'X',
          total: 420000,
          installments: 12,
          installmentAmount: 30000,
          firstMonth: '2027-01',
          withInterest: false,
        },
        OPEN,
      ),
    ).toThrow(InvalidInstallmentsError);
    expect(() =>
      card.addPurchase(
        'p3',
        {
          description: 'X',
          total: 420000,
          installments: 12,
          installmentAmount: 30000,
          firstMonth: '2027-01',
          withInterest: true,
        },
        OPEN,
      ),
    ).toThrow('com juros');
    const withInterest = card.addPurchase(
      'p4',
      {
        description: 'Y',
        total: 100000,
        installments: 10,
        installmentAmount: 11000,
        firstMonth: '2027-01',
        withInterest: true,
      },
      OPEN,
    );
    expect(purchaseInstallment(withInterest, 10)).toBe(11000);
  });
});

describe('Commitments', () => {
  const loan = (
    details: { total?: number; endMonth?: string },
    amount: number,
  ) =>
    Commitment.create(
      'loan',
      OWNER,
      {
        name: 'Dívida',
        category: 'LOAN',
        dueDay: 5,
        startMonth: '2026-12',
        endMonth: details.endMonth ?? null,
        total: details.total ?? null,
        cardId: null,
        notes: null,
      },
      { amount, certainty: 'CONFIRMED', note: null },
      OPEN,
    );

  it('ends a debt with a total once its installments reach it', () => {
    const debt = loan({ total: 400000 }, 50000);
    const schedule = debt.schedule('2028-12');
    expect(schedule).toHaveLength(8);
    expect(schedule.at(-1)).toMatchObject({
      month: '2027-07',
      last: true,
      installment: { number: 8, total: 8 },
    });
    expect(debt.remainingAfter('2027-02')).toBe(250000);
  });

  it('caps the last installment at what is left of the debt', () => {
    const debt = loan({ total: 120000 }, 50000);
    expect(debt.schedule('2028-12').map((item) => item.effective)).toEqual([
      50000, 50000, 20000,
    ]);
  });

  it('refuses installments that go past the total of the debt', () => {
    expect(() => loan({ total: 100000, endMonth: '2027-02' }, 50000)).toThrow(
      InstallmentsExceedDebtError,
    );
  });

  it('changes the amount from a month on without touching the months before', () => {
    const subscription = Commitment.create(
      's',
      OWNER,
      {
        name: 'Streaming',
        category: 'SUBSCRIPTION',
        dueDay: null,
        startMonth: '2026-12',
        endMonth: null,
        total: null,
        cardId: null,
        notes: null,
      },
      { amount: 3990, certainty: 'CONFIRMED', note: null },
      OPEN,
    );
    subscription.changeFrom(
      '2027-03',
      { amount: 4590, active: true, certainty: 'CONFIRMED', note: null },
      OPEN,
    );
    subscription.changeFrom(
      '2027-05',
      { amount: 4590, active: false, certainty: 'CONFIRMED', note: null },
      OPEN,
    );
    const amounts = subscription
      .schedule('2027-06')
      .map((item) => [item.month, item.effective]);
    expect(amounts).toEqual([
      ['2026-12', 3990],
      ['2027-01', 3990],
      ['2027-02', 3990],
      ['2027-03', 4590],
      ['2027-04', 4590],
    ]);
  });

  it('protects closed months from changes and payments', () => {
    const debt = loan({ total: 400000 }, 50000);
    const lock = MonthLock.through('2027-01');
    expect(() =>
      debt.changeFrom(
        '2027-01',
        { amount: 1, active: true, certainty: 'CONFIRMED', note: null },
        lock,
      ),
    ).toThrow(ClosedMonthError);
    expect(() =>
      debt.recordPayment(
        { month: '2026-12', amount: 50000, paidOn: '2026-12-05' },
        lock,
      ),
    ).toThrow(ClosedMonthError);
    debt.changeFrom(
      '2027-02',
      { amount: 60000, active: true, certainty: 'CONFIRMED', note: null },
      lock,
    );
  });
});

describe('Reference projection (Dec/2026 – Apr/2027)', () => {
  const projection = () => projectPlan(referencePlan(), '2026-12', '2027-04');

  it('reproduces the monthly totals of known obligations', () => {
    expect(projection().map((month) => month.expenses.total)).toEqual([
      321212, 242773, 228790, 164580, 164580,
    ]);
  });

  it('shows every bill on its own line', () => {
    const [december, january, february, march] = projection();
    expect(amountOf(december, 'Nubank PF')).toBe(86199);
    expect(amountOf(december, 'Nubank PJ')).toBe(28713);
    expect(amountOf(december, 'Outro cartão')).toBe(20000);
    expect(amountOf(december, 'Pacote da viagem')).toBe(35000);
    expect(amountOf(december, 'Empréstimo 3')).toBe(8800);
    expect(amountOf(january, 'Empréstimo 3')).toBe(8300);
    expect(amountOf(december, 'Empréstimo 4')).toBe(16700);
    expect(line(december, 'Empréstimo 4')?.certainty).toBe('ESTIMATED');
    expect(amountOf(december, 'Assinatura de IA')).toBe(11000);
    expect(line(january, 'Assinatura de IA')).toBeUndefined();
    expect(amountOf(march, 'Empréstimo 1')).toBe(0);
    expect(line(february, 'Pacote da viagem')?.installment).toEqual({
      number: 3,
      total: 12,
    });
  });

  it('marks the inferred PJ installment as estimated and later months as unknown, not zero', () => {
    const [, , february, march, april] = projection();
    expect(line(february, 'Nubank PJ')).toMatchObject({
      amount: 13181,
      certainty: 'ESTIMATED',
    });
    expect(line(march, 'Nubank PJ')).toMatchObject({
      amount: 0,
      certainty: 'UNKNOWN',
    });
    expect(line(april, 'Nubank PJ')?.certainty).toBe('UNKNOWN');
  });

  it('counts a card estimate only from its start month', () => {
    const [november, december] = projectPlan(
      referencePlan(),
      '2026-11',
      '2026-12',
    );
    expect(line(november, 'Outro cartão')).toBeUndefined();
    expect(line(december, 'Outro cartão')).toMatchObject({
      amount: 20000,
      certainty: 'ESTIMATED',
    });
  });

  it('never adds a card subscription on top of its statement', () => {
    const [december] = projection();
    const apple = line(december, 'Loja de apps');
    expect(apple).toMatchObject({ counted: false, certainty: 'UNKNOWN' });
    expect(december.expenses.total).toBe(321212);
  });

  it('reproduces the balance of every salary band', () => {
    const table = projection().map((month) =>
      month.scenarios.map((scenario) => scenario.balance),
    );
    expect(table).toEqual([
      [-21212, 8788, 38788, 58788, 78788],
      [57227, 87227, 117227, 137227, 157227],
      [71210, 101210, 131210, 151210, 171210],
      [135420, 165420, 195420, 215420, 235420],
      [135420, 165420, 195420, 215420, 235420],
    ]);
  });

  it('frees the loans the month after they end', () => {
    const [, , february, march] = projection();
    expect(line(february, 'Empréstimo 1')?.last).toBe(true);
    expect(march.freed).toEqual(
      expect.arrayContaining([
        { name: 'Empréstimo 1', amount: 19400 },
        { name: 'Empréstimo 2', amount: 13400 },
      ]),
    );
  });

  it('counts only confirmed reserve money as saved and keeps R$ 300 to receive apart', () => {
    const [december] = projection();
    expect(december.reserves).toEqual({ confirmed: 140000, potential: 170000 });
  });

  it('knows the open debt and which ones have no known end', () => {
    const [december] = projection();
    expect(december.debt.unknown).toEqual(['Empréstimo 4']);
    expect(december.debt.known).toBe(350000 + 2 * 19400 + 2 * 13400 + 8300);
  });

  it('flags a high risk when the month closes negative on the conservative salary', () => {
    const plan = referencePlan();
    plan.salary.setOverride(
      { month: '2026-12', amount: 300000, certainty: 'CONFIRMED', note: null },
      OPEN,
    );
    const [december, january] = projectPlan(plan, '2026-12', '2027-01');
    expect(december.balance).toBe(-21212);
    expect(december.risk).toBe('HIGH');
    expect(january.balance).toBe(87227);
  });
});

describe('Scenarios', () => {
  it('recalculates without touching months before the change', () => {
    const plan = referencePlan();
    applyScenario(
      plan,
      [
        {
          type: 'CHANGE_FROM',
          commitmentId: plan.salary.id,
          fromMonth: '2027-02',
          amount: 380000,
          active: null,
        },
        {
          type: 'ADD_ONE_OFF',
          category: 'FREELANCE',
          name: 'Site cliente',
          month: '2027-01',
          amount: 80000,
        },
        {
          type: 'CHANGE_FROM',
          commitmentId: plan.claude.id,
          fromMonth: '2027-03',
          amount: null,
          active: true,
        },
      ],
      { ownerId: OWNER, newId, lock: OPEN },
    );
    const months = projectPlan(plan, '2026-12', '2027-04');
    expect(months[0].balance).toBe(8788);
    expect(months[1].income.total).toBe(410000);
    expect(months[2].income.total).toBe(380000);
    expect(amountOf(months[3], 'Assinatura de IA')).toBe(11000);
  });

  it('shortens a debt paid in advance', () => {
    const plan = referencePlan();
    applyScenario(
      plan,
      [
        {
          type: 'PREPAY_DEBT',
          commitmentId: plan.debt.id,
          month: '2027-01',
          amount: 100000,
        },
      ],
      {
        ownerId: OWNER,
        newId,
        lock: OPEN,
      },
    );
    expect(plan.debt.lastMonth()).toBe('2027-05');
    const loanPlan = referencePlan();
    applyScenario(
      loanPlan,
      [
        {
          type: 'PREPAY_DEBT',
          commitmentId: loanPlan.loan1.id,
          month: '2026-12',
          amount: 19400,
        },
      ],
      {
        ownerId: OWNER,
        newId,
        lock: OPEN,
      },
    );
    expect(loanPlan.loan1.lastMonth()).toBe('2027-01');
  });

  it('moves the trip package and its installments', () => {
    const plan = referencePlan();
    applyScenario(
      plan,
      [
        {
          type: 'CHANGE_PURCHASE',
          cardId: 'card-other',
          purchaseId: 'trip-package',
          total: 480000,
          firstMonth: '2027-01',
        },
      ],
      { ownerId: OWNER, newId, lock: OPEN },
    );
    const [december, january] = projectPlan(plan, '2026-12', '2027-01');
    expect(line(december, 'Pacote da viagem')).toBeUndefined();
    expect(amountOf(january, 'Pacote da viagem')).toBe(40000);
  });
});

describe('Trip goal', () => {
  it('separates the package, the trip money, the emergency reserve and contributions', () => {
    const plan = referencePlan();
    const trip = plan.funds[1];
    trip.addMovement(
      newId(),
      {
        date: '2026-12-20',
        kind: 'DEPOSIT',
        source: 'ACCOUNT',
        status: 'CONFIRMED',
        amount: 50000,
        contributor: null,
        note: null,
      },
      OPEN,
    );
    trip.addMovement(
      newId(),
      {
        date: '2026-12-22',
        kind: 'DEPOSIT',
        source: 'EXTERNAL',
        status: 'CONFIRMED',
        amount: 20000,
        contributor: 'Outra pessoa',
        note: null,
      },
      OPEN,
    );
    const months = projectPlan(plan, '2026-12', '2027-12');
    const status = goalStatus(trip, plan, months, '2026-12');
    expect(status).toMatchObject({
      target: 500000,
      reserved: 70000,
      contributionsReceived: 20000,
      expectedContribution: 0,
      remaining: 430000,
      monthsLeft: 4,
      monthlyNeeded: 107500,
      protectedReserves: 140000,
      package: {
        total: 420000,
        installments: 12,
        lastMonth: '2027-11',
        remainingInstallments: 12,
        remainingAmount: 420000,
      },
    });
  });
});

describe('Month report', () => {
  it('compares with the previous month and with the plan of when the month opened', () => {
    const plan = referencePlan();
    const [december] = projectPlan(plan, '2026-12', '2026-12');
    const snapshot = MonthSnapshot.take('snap', OWNER, december, '2026-12-01');
    plan.commitments[6].recordPayment(
      { month: '2026-12', amount: 13000, paidOn: '2026-12-10' },
      OPEN,
    );
    const [november, current] = projectPlan(plan, '2026-11', '2026-12');
    const report = monthReport(current, november, snapshot);
    const gym = report.comparison.find((item) => item.name === 'Academia');
    expect(gym).toMatchObject({ planned: 12000, actual: 13000 });
    expect(report.actual.expenses).toBe(13000);
    expect(report.toPay).toBe(321212 - 12000);
  });

  it('lists what got cheaper and what ended', () => {
    const [, january, february] = projectPlan(
      referencePlan(),
      '2026-12',
      '2027-02',
    );
    const report = monthReport(february, january, null);
    expect(report.decreased.map((item) => item.name)).toEqual(
      expect.arrayContaining(['Nubank PJ']),
    );
    expect(report.freed).toEqual([{ name: 'Empréstimo 3', amount: 8300 }]);
  });
});

describe('Imports into the reference cards', () => {
  it('infers the third PJ installment only from the series it saw', () => {
    const business = CreditCard.create('pj', OWNER, {
      name: 'PJ',
      scope: 'BUSINESS',
      dueDay: 19,
      monthlyEstimate: null,
      estimateFrom: null,
    });
    business.importStatement(
      '2027-01-19',
      parseStatementCsv(PJ_JANUARY),
      newId,
      OPEN,
    );
    const plan = { ...referencePlan(), cards: [business], commitments: [] };
    const [february, march] = projectPlan(plan, '2027-02', '2027-03');
    expect(line(february, 'PJ')?.items).toEqual([
      {
        kind: 'INFERRED',
        label: 'Limite convertido em saldo na sua conta Nu Empresas - 3/3',
        amount: 13181,
        date: null,
      },
    ]);
    expect(line(march, 'PJ')?.certainty).toBe('UNKNOWN');
  });
});
