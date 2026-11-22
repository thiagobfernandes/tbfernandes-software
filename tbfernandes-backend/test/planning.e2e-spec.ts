import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  PF_DECEMBER,
  PJ_JANUARY,
} from '../src/modules/finance/domain/planning/testing/statement-fixtures';
import { create, startApp } from './support/test-app';

interface Line {
  name: string;
  amount: number;
  certainty: string;
  counted: boolean;
}

describe('Financial planning API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  const projection = async (from: string, months: number) => {
    const response = await http().get(
      `/api/v1/finance/planning/projection?from=${from}&months=${months}`,
    );
    expect(response.status).toBe(200);
    return response.body as {
      month: string;
      lines: Line[];
      expenses: { total: number };
      income: { total: number };
      balance: number;
      scenarios: { label: string; balance: number }[];
    }[];
  };

  it('imports a statement once even when the same CSV is sent twice', async () => {
    ids.card = await create(app, '/api/v1/finance/cards', {
      name: 'Nubank PF',
      scope: 'personal',
      dueDay: 19,
    });
    const send = () =>
      http()
        .post(`/api/v1/finance/cards/${ids.card}/imports`)
        .send({ dueDate: '2036-12-19', csv: PF_DECEMBER });
    const first = await send();
    const second = await send();
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      month: '2036-12',
      imported: 18,
      total: 861.99,
    });
    expect(second.body).toMatchObject({
      imported: 0,
      skipped: 18,
      total: 861.99,
    });
    expect(second.body.card.transactions).toHaveLength(18);
  });

  it('keeps commitments with history and projects them month by month', async () => {
    ids.salary = await create(app, '/api/v1/finance/commitments', {
      name: 'Salário',
      category: 'salary',
      dueDay: 5,
      startMonth: '2036-12',
      amount: 3300,
      certainty: 'estimated',
    });
    ids.loan = await create(app, '/api/v1/finance/commitments', {
      name: 'Dívida pessoal',
      category: 'loan',
      startMonth: '2036-12',
      total: 1200,
      amount: 500,
    });
    ids.claude = await create(app, '/api/v1/finance/commitments', {
      name: 'Assinatura de IA',
      category: 'subscription',
      startMonth: '2036-12',
      amount: 110,
    });
    const suspended = await http()
      .post(`/api/v1/finance/commitments/${ids.claude}/changes`)
      .send({ fromMonth: '2037-01', amount: 110, active: false });
    expect(suspended.status).toBe(200);
    await http()
      .put(`/api/v1/finance/planning/settings`)
      .send({ salaryScenarios: [{ label: 'Conservador', amount: 3000 }] })
      .expect(200);

    const [december, january, february, march] = await projection('2036-12', 4);
    expect(december.expenses.total).toBe(861.99 + 500 + 110);
    // December showed 1/2 of two purchases: their 2/2 (40,88 + 78,17) is inferred for January.
    expect(january.expenses.total).toBe(619.05);
    expect(
      february.lines.find((line) => line.name === 'Dívida pessoal')?.amount,
    ).toBe(200);
    expect(
      march.lines.find((line) => line.name === 'Dívida pessoal'),
    ).toBeUndefined();
    expect(december.scenarios).toEqual([
      { label: 'Conservador', salary: 3000, balance: 3000 - 1471.99 },
    ]);
  });

  it('refuses installments that go past the total of a debt', async () => {
    const response = await http().post('/api/v1/finance/commitments').send({
      name: 'Errado',
      category: 'loan',
      startMonth: '2036-12',
      endMonth: '2037-05',
      total: 1000,
      amount: 500,
    });
    expect(response.status).toBe(422);
    expect(response.body.detail).toContain('ultrapassam o total');
  });

  it('simulates without saving and saves only on confirm', async () => {
    const operations = [
      {
        type: 'change_from',
        commitmentId: ids.salary,
        fromMonth: '2037-01',
        amount: 3800,
      },
      {
        type: 'add_one_off',
        category: 'freelance',
        name: 'Site',
        month: '2036-12',
        amount: 900,
      },
    ];
    const simulated = await http()
      .post('/api/v1/finance/planning/simulate')
      .send({ from: '2036-12', months: 2, operations });
    expect(simulated.status).toBe(200);
    expect(simulated.body.simulated[0].income.total).toBe(4200);
    expect(simulated.body.simulated[1].income.total).toBe(3800);
    expect((await projection('2036-12', 1))[0].income.total).toBe(3300);

    await http()
      .post('/api/v1/finance/planning/scenario/apply')
      .send({ operations })
      .expect(204);
    const [december, january] = await projection('2036-12', 2);
    expect(december.income.total).toBe(4200);
    expect(january.income.total).toBe(3800);
  });

  it('infers future installments and marks months without data as unknown', async () => {
    const business = await create(app, '/api/v1/finance/cards', {
      name: 'Nubank PJ',
      scope: 'business',
      dueDay: 19,
    });
    await http()
      .post(`/api/v1/finance/cards/${business}/imports`)
      .send({ dueDate: '2037-01-19', csv: PJ_JANUARY })
      .expect(200);
    const [february, march] = await projection('2037-02', 2);
    expect(
      february.lines.find((line) => line.name === 'Nubank PJ'),
    ).toMatchObject({
      amount: 131.81,
      certainty: 'estimated',
    });
    expect(march.lines.find((line) => line.name === 'Nubank PJ')).toMatchObject(
      {
        amount: 0,
        certainty: 'unknown',
      },
    );
  });

  it('keeps reserves apart and does not count money still to receive', async () => {
    const fund = await create(app, '/api/v1/finance/reserves', {
      name: 'Reserva de emergência',
      kind: 'emergency',
      protected: true,
    });
    await http()
      .post(`/api/v1/finance/reserves/${fund}/movements`)
      .send({
        date: '2026-11-01',
        kind: 'deposit',
        source: 'external',
        amount: 1400,
      })
      .expect(200);
    const pending = await http()
      .post(`/api/v1/finance/reserves/${fund}/movements`)
      .send({
        date: '2026-11-02',
        kind: 'deposit',
        source: 'external',
        status: 'expected',
        amount: 300,
      });
    expect(pending.body).toMatchObject({
      balance: 1400,
      potentialBalance: 1700,
      pending: 300,
    });
    const overdraw = await http()
      .post(`/api/v1/finance/reserves/${fund}/movements`)
      .send({ date: '2026-11-03', kind: 'withdrawal', amount: 2000 });
    expect(overdraw.status).toBe(422);
  });

  it('shows the overview and the month report', async () => {
    const overview = await http().get('/api/v1/finance/planning/overview');
    expect(overview.status).toBe(200);
    expect(overview.body.projection.reserves).toEqual({
      confirmed: 1400,
      potential: 1700,
    });
    const report = await http().get(
      '/api/v1/finance/planning/report?month=2037-01',
    );
    expect(report.status).toBe(200);
    const decreased = report.body.decreased as { name: string }[];
    expect(decreased.map((item) => item.name)).toContain('Nubank PF');
  });

  it('closes months and refuses changes to them', async () => {
    const closed = await http()
      .post('/api/v1/finance/planning/months/close')
      .send({ month: '2026-11' });
    expect(closed.status).toBe(200);
    expect(closed.body.closedThrough).toBe('2026-11');
    const late = await http().post('/api/v1/finance/commitments').send({
      name: 'Antigo',
      category: 'fixed',
      startMonth: '2026-10',
      amount: 50,
    });
    expect(late.status).toBe(422);
    expect(late.body.detail).toContain('fechado');
    await http()
      .post('/api/v1/finance/planning/months/reopen')
      .send({ month: '2026-10' })
      .expect(200);
  });

  it('validates months in the path', async () => {
    const response = await http()
      .put(`/api/v1/finance/commitments/${ids.salary}/payments/2036-13`)
      .send({ amount: 3300, paidOn: '2036-12-05' });
    expect(response.status).toBe(400);
  });
});
