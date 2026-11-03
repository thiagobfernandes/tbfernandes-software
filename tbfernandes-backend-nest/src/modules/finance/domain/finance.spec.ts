import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../common/domain';
import { BankAccount, BankConnection } from './connection/bank-connection';
import { CashFlows } from './cash-flow';
import { EntryDetails, FinanceEntry } from './entry/finance-entry';
import { Money } from './money';
import { PurchaseDetails, PurchaseGoal } from './purchase/purchase-goal';

const DAY = '2031-03-05';

describe('Money', () => {
  it('turns JSON numbers and numeric text into cents, rounding half to even', () => {
    expect(Money.cents(1500)).toBe(150000);
    expect(Money.cents(900.5)).toBe(90050);
    expect(Money.cents('1500.00')).toBe(150000);
    expect(Money.cents('-10.50')).toBe(-1050);
    expect(Money.cents(0.125)).toBe(12);
    expect(Money.cents(0.135)).toBe(14);
    expect(Money.cents(0.1251)).toBe(13);
    expect(Money.cents(0.001)).toBe(0);
    expect(Money.cents(55.3)).toBe(5530);
    expect(Money.cents(12.345)).toBe(1234);
    expect(Money.cents(1e-7)).toBe(0);
  });

  it('writes cents for the JSON and for numeric columns', () => {
    expect(Money.toNumber(340050)).toBe(3400.5);
    expect(Money.toDecimal(5)).toBe('0.05');
    expect(Money.toDecimal(-1050)).toBe('-10.50');
  });

  it('refuses amounts that are not positive', () => {
    expect(() => Money.positive(0, 'amount')).toThrow(InvalidArgumentError);
    expect(() => Money.positive(-500, 'amount')).toThrow(
      'amount deve ser maior que zero',
    );
    expect(Money.optionalPositive(null, 'paid')).toBeNull();
  });
});

const entry = (details: Partial<EntryDetails>) =>
  FinanceEntry.create('e', 'o1', {
    kind: 'EXPENSE',
    scope: 'PERSONAL',
    category: 'Food',
    description: 'x',
    amount: 100,
    date: DAY,
    recurring: false,
    ...details,
  });

describe('CashFlows', () => {
  it('builds the series up to the selected month and its expenses by category', () => {
    const flow = CashFlows.build('2031-03', 3, 'PERSONAL', [
      entry({ kind: 'INCOME', amount: 600000, category: 'Pro-labore' }),
      entry({ amount: 250000, category: 'Rent' }),
      entry({ amount: 90050, category: 'Food' }),
      entry({ amount: 10000, category: 'Food', date: '2031-01-12' }),
    ]);
    expect(flow.series.map((m) => m.month)).toEqual([
      '2031-01',
      '2031-02',
      '2031-03',
    ]);
    expect(flow.series[0].expense).toBe(10000);
    expect(flow.series[1]).toEqual({
      month: '2031-02',
      income: 0,
      expense: 0,
      balance: 0,
    });
    expect(flow.totals).toEqual({
      month: '2031-03',
      income: 600000,
      expense: 340050,
      balance: 259950,
    });
    expect(flow.expensesByCategory).toEqual([
      { category: 'Rent', amount: 250000 },
      { category: 'Food', amount: 90050 },
    ]);
  });

  it('shows at least one month and crosses years', () => {
    expect(CashFlows.firstMonth('2031-03', 0)).toBe('2031-03');
    expect(CashFlows.firstMonth('2031-02', 3)).toBe('2030-12');
  });
});

const purchase: PurchaseDetails = {
  name: 'Desk',
  description: null,
  estimated: 300000,
  reserved: 100000,
  monthlySaving: 60000,
  priority: null,
  desiredDate: null,
  goalId: null,
  status: null,
  paid: null,
};

describe('PurchaseGoal', () => {
  it('projects when the purchase becomes affordable (FIN-04)', () => {
    const desk = PurchaseGoal.create('p', 'o1', {
      ...purchase,
      desiredDate: '2031-06-30',
    });
    expect(desk.project(DAY)).toEqual({
      missing: 200000,
      ready: false,
      months: 4,
      month: '2031-07',
      onTime: false,
    });
    expect(desk.status).toBe('PLANNED');
    expect(desk.priority).toBe('NORMAL');
  });

  it('is ready when all is reserved and has no months without a saving', () => {
    expect(
      PurchaseGoal.create('p', 'o1', { ...purchase, reserved: 400000 }).project(
        DAY,
      ),
    ).toMatchObject({ missing: 0, ready: true, months: null });
    expect(
      PurchaseGoal.create('p', 'o1', {
        ...purchase,
        monthlySaving: null,
      }).project(DAY),
    ).toMatchObject({ missing: 200000, ready: false, months: null });
  });

  it('needs the amount paid once bought (RN-17) and no negative reserve (RN-18)', () => {
    expect(() =>
      PurchaseGoal.create('p', 'o1', { ...purchase, status: 'BOUGHT' }),
    ).toThrow(BusinessRuleViolationError);
    expect(() =>
      PurchaseGoal.create('p', 'o1', { ...purchase, reserved: -1 }),
    ).toThrow('O valor reservado não pode ser negativo');
  });
});

describe('BankConnection', () => {
  const business = () =>
    BankConnection.connect('c', 'o1', 'item-1', 'Nubank', 'BUSINESS', 'ACTIVE');

  it('imports with its scope and the direction from the sign', () => {
    const expense = business().importEntry(
      'e1',
      't1',
      DAY,
      'Mercado',
      -1050,
      'Food',
    )!;
    expect(expense.details).toMatchObject({
      kind: 'EXPENSE',
      amount: 1050,
      scope: 'BUSINESS',
    });
    expect(expense.source).toBe('OPEN_FINANCE');
    expect(expense.externalId).toBe('t1');
    expect(
      business().importEntry('e2', 't2', DAY, 'Pix', 9900, 'Transfer')!.details
        .kind,
    ).toBe('INCOME');
  });

  it('does not import a zero amount', () => {
    expect(business().importEntry('e', 't', DAY, 'Estorno', 0, 'x')).toBeNull();
  });

  it('cuts or fills provider text instead of failing the sync', () => {
    const long = business().importEntry(
      'e',
      't',
      DAY,
      'd'.repeat(400),
      100,
      null,
    )!;
    expect(long.details.description).toHaveLength(300);
    expect(long.details.category).toBe('Sem categoria');
    const blank = business().importEntry(
      'e',
      't',
      DAY,
      ' ',
      100,
      'c'.repeat(80),
    )!;
    expect(blank.details.description).toBe('Sem descrição');
    expect(blank.details.category).toHaveLength(60);
  });

  it('keeps what the last good sync knew when one fails', () => {
    const connection = business();
    const at = new Date('2031-03-05T10:00:00Z');
    const accounts: BankAccount[] = [
      {
        externalId: 'a1',
        name: 'Conta',
        type: 'BANK',
        balance: 1000,
        currency: 'BRL',
      },
    ];
    connection.synced('Nubank', 'ACTIVE', accounts, at);

    connection.syncFailed('Pluggy fora do ar');

    expect(connection.details).toMatchObject({
      status: 'ERROR',
      lastError: 'Pluggy fora do ar',
      lastSyncedAt: at,
      accounts,
    });
    connection.synced('Nubank', 'ACTIVE', accounts, new Date());
    expect(connection.details.lastError).toBeNull();
  });
});
