import { EntryDetails, FinanceEntry } from '../entry/finance-entry';
import { expenseBreakdown, ExpenseBreakdownInput } from './expense-breakdown';
import { MonthLock } from './plan-types';
import { projectPlan } from './projection/plan-projector';
import { OWNER, newId, referencePlan } from './testing/reference-plan';

const OPEN = MonthLock.none();

function entry(details: Partial<EntryDetails>): FinanceEntry {
  return FinanceEntry.create(newId(), OWNER, {
    kind: 'EXPENSE',
    scope: 'PERSONAL',
    category: 'Alimentação',
    description: 'Mercado',
    amount: 5000,
    date: '2026-12-08',
    recurring: false,
    ...details,
  });
}

function breakdownOf(
  month: string,
  overrides: Partial<ExpenseBreakdownInput> = {},
  plan = referencePlan(),
) {
  const [projection] = projectPlan(plan, month, month);
  return expenseBreakdown({
    month,
    scope: null,
    projection,
    commitments: plan.commitments,
    cards: plan.cards,
    entries: [],
    ...overrides,
  });
}

describe('Expense breakdown', () => {
  it('matches the projection of the month, so Gastos and Próximos meses agree', () => {
    const december = breakdownOf('2026-12');
    expect(december.totals.planned).toBe(321212);
    expect(december.totals.total).toBe(321212);
    expect(december.reconciliation.projection).toBe(321212);
    expect(breakdownOf('2027-01').totals.planned).toBe(242773);
  });

  it('never adds a card purchase on top of the statement it is in', () => {
    const december = breakdownOf('2026-12');
    const card = december.items.find((item) => item.name === 'Nubank PF');
    expect(card?.amount).toBe(86199);
    expect(card?.items.reduce((sum, part) => sum + part.amount, 0)).toBe(86199);
    const subscription = december.items.find(
      (item) => item.name === 'Loja de apps',
    );
    expect(subscription?.counted).toBe(false);
    expect(subscription?.excludedReason).toContain('fatura');
  });

  it('splits personal and business without losing anything', () => {
    const plan = referencePlan();
    const business = breakdownOf('2026-12', { scope: 'BUSINESS' }, plan);
    const personal = breakdownOf('2026-12', { scope: 'PERSONAL' }, plan);
    expect(business.items.map((item) => item.name)).toEqual(['Nubank PJ']);
    expect(business.totals.total).toBe(28713);
    expect(personal.totals.total + business.totals.total).toBe(321212);
  });

  it('shows a suspended subscription as cancelled, without counting it', () => {
    const january = breakdownOf('2027-01');
    const suspended = january.items.find(
      (item) => item.name === 'Assinatura de IA',
    );
    expect(suspended).toMatchObject({
      status: 'CANCELLED',
      amount: 0,
      counted: false,
    });
    expect(january.totals.total).toBe(242773);
  });

  it('tells forecast, pending and paid apart', () => {
    const plan = referencePlan();
    plan.loan1.recordPayment(
      { month: '2026-12', amount: 19400, paidOn: '2026-12-10' },
      OPEN,
    );
    const december = breakdownOf('2026-12', {}, plan);
    const loan = december.items.find((item) => item.name === 'Empréstimo 1');
    const debt = december.items.find((item) => item.name === 'Dívida pessoal');
    const loan2 = december.items.find((item) => item.name === 'Empréstimo 2');
    expect(loan?.status).toBe('PAID');
    expect(debt?.status).toBe('FORECAST');
    expect(loan2?.status).toBe('PENDING');
    expect(december.totals.paid).toBe(19400);
    expect(december.totals.pending).toBe(321212 - 19400);
    expect(december.totals.realized + december.totals.forecast).toBe(321212);
  });

  it('adds money spent outside the plan, but not transfers or statement payments', () => {
    const december = breakdownOf('2026-12', {
      entries: [
        entry({}),
        entry({
          category: 'Transferência',
          description: 'Pagamento de fatura Nubank',
          amount: 86199,
        }),
        entry({ kind: 'INCOME', description: 'Freela', amount: 90000 }),
      ],
    });
    expect(december.totals.entries).toBe(5000);
    expect(december.totals.total).toBe(321212 + 5000);
    expect(december.totals.planned).toBe(321212);
    expect(december.reconciliation.excludedEntries).toBe(86199);
    expect(
      december.items.filter((item) => item.source === 'ENTRY'),
    ).toHaveLength(2);
  });
});
