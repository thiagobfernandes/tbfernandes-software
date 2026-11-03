import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ExternalServiceError } from '../src/common/domain';
import {
  ConnectToken,
  ExternalAccount,
  ExternalConnection,
  ExternalTransaction,
  OpenFinanceGateway,
} from '../src/modules/finance/application/open-finance.gateway';
import type { ConnectionStatus } from '../src/modules/finance/domain';
import { create, eventually, startApp } from './support/test-app';

/** Owner of the single-user mode. */
const OWNER = '0192f000-0000-7000-8000-000000000001';

/** Stands in for Pluggy, as the FakeGateway of the old backend's tests. */
class FakeGateway extends OpenFinanceGateway {
  transactions: ExternalTransaction[] = [];
  deleted: string[] = [];
  failing = false;
  status: ConnectionStatus = 'ACTIVE';

  enabled() {
    return true;
  }

  createConnectToken(clientUserId: string): Promise<ConnectToken> {
    return Promise.resolve({ accessToken: `token-for-${clientUserId}` });
  }

  getConnection(id: string): Promise<ExternalConnection> {
    return this.answer({ id, institution: 'Banco Teste', status: this.status });
  }

  listAccounts(): Promise<ExternalAccount[]> {
    return this.answer([
      {
        id: 'acc',
        name: 'Conta',
        type: 'BANK',
        balance: 1000,
        currency: 'BRL',
      },
    ]);
  }

  listTransactions(): Promise<ExternalTransaction[]> {
    return this.answer([...this.transactions]);
  }

  deleteConnection(id: string): Promise<void> {
    this.deleted.push(id);
    return Promise.resolve();
  }

  private answer<T>(value: T): Promise<T> {
    return this.failing
      ? Promise.reject(new ExternalServiceError('Pluggy fora do ar'))
      : Promise.resolve(value);
  }
}

interface Connection {
  id: string;
  institution: string;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  accounts: { name: string }[];
}

const expense = (id: string, date: string): ExternalTransaction => ({
  id,
  accountId: 'acc',
  date,
  description: 'Mercado',
  amount: -2500,
  currency: 'BRL',
  category: 'Food',
});

/** Port of FinanceApiIntegrationTests (the goal link waits for the goals module). */
describe('Finance API', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(() => app.close());

  const entry = (
    kind: string,
    scope: string,
    category: string,
    amount: number,
    date: string,
  ) =>
    create(app, '/api/v1/finance/entries', {
      kind,
      scope,
      category,
      description: 'test',
      amount,
      date,
    });

  it('separates scopes in the cash flow and groups expenses', async () => {
    await entry('income', 'business', 'Invoices', 10000, '2031-03-05');
    await entry('income', 'personal', 'Pro-labore', 6000, '2031-03-06');
    await entry('expense', 'personal', 'Rent', 2500, '2031-03-10');
    await entry('expense', 'personal', 'Food', 900.5, '2031-03-12');
    await entry('expense', 'personal', 'Food', 100, '2031-02-12');

    const personal = await http().get(
      '/api/v1/finance/cash-flow?month=2031-03&months=2&scope=personal',
    );
    expect(personal.status).toBe(200);
    expect(personal.body).toMatchObject({
      month: '2031-03',
      scope: 'personal',
      totals: {
        month: '2031-03',
        income: 6000,
        expense: 3400.5,
        balance: 2599.5,
      },
      expensesByCategory: [
        { category: 'Rent', amount: 2500 },
        { category: 'Food', amount: 900.5 },
      ],
    });
    expect(personal.body.series[0]).toMatchObject({
      month: '2031-02',
      expense: 100,
    });

    const all = await http().get(
      '/api/v1/finance/cash-flow?month=2031-03&months=1',
    );
    expect(all.body).toMatchObject({ scope: 'all', totals: { income: 16000 } });
    expect(all.body.series).toHaveLength(1);

    const business = await http().get(
      '/api/v1/finance/entries?month=2031-03&scope=business',
    );
    expect(business.body).toEqual([
      expect.objectContaining({
        kind: 'income',
        scope: 'business',
        category: 'Invoices',
        amount: 10000,
        date: '2031-03-05',
        recurring: false,
      }),
    ]);
  });

  it('refuses amounts that are not positive and unknown months', async () => {
    const negative = await http().post('/api/v1/finance/entries').send({
      kind: 'expense',
      scope: 'personal',
      category: 'x',
      description: 'x',
      amount: -5,
      date: '2031-01-01',
    });
    expect(negative.status).toBe(400);
    expect(
      (await http().get('/api/v1/finance/entries?month=2031-13')).status,
    ).toBe(400);
  });

  it('updates and deletes an entry', async () => {
    const id = await entry('expense', 'personal', 'Food', 10, '2031-04-01');
    const updated = await http().put(`/api/v1/finance/entries/${id}`).send({
      kind: 'expense',
      scope: 'personal',
      category: 'Food',
      description: 'Feira',
      amount: 12.345,
      date: '2031-04-01',
      recurring: true,
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      description: 'Feira',
      amount: 12.34,
      recurring: true,
    });
    expect((await http().delete(`/api/v1/finance/entries/${id}`)).status).toBe(
      204,
    );
    expect((await http().get(`/api/v1/finance/entries/${id}`)).status).toBe(
      404,
    );
  });

  it('projects a purchase and enforces RN-17', async () => {
    const id = await create(app, '/api/v1/finance/purchases', {
      name: 'Desk',
      estimated: 3000,
      reserved: 1000,
      monthlySaving: 600,
    });

    const purchase = await http().get(`/api/v1/finance/purchases/${id}`);
    expect(purchase.body).toEqual({
      id,
      name: 'Desk',
      description: null,
      estimated: 3000,
      reserved: 1000,
      monthlySaving: 600,
      priority: 'normal',
      desiredDate: null,
      goalId: null,
      status: 'planned',
      paid: null,
    });

    const projection = await http().get(
      `/api/v1/finance/purchases/${id}/projection`,
    );
    expect(projection.body).toMatchObject({
      missing: 2000,
      ready: false,
      months: 4,
      onTime: null,
    });

    const bought = await http()
      .put(`/api/v1/finance/purchases/${id}`)
      .send({ name: 'Desk', estimated: 3000, status: 'bought' });
    expect(bought.status).toBe(422);
    expect(bought.body.rule).toBe('RN-17');
  });

  it('reports open finance as off without a provider (RN-15)', async () => {
    const availability = await http().get(
      '/api/v1/finance/connections/availability',
    );
    expect(availability.body).toEqual({ enabled: false });
    const token = await http()
      .post('/api/v1/finance/connections/token')
      .send({ scope: 'personal' });
    expect(token.status).toBe(422);
    expect(token.body.rule).toBe('RN-15');
  });
});

/** Port of OpenFinanceApiIntegrationTests. */
describe('Open finance API', () => {
  let app: INestApplication<App>;
  const gateway = new FakeGateway();
  const http = () => request(app.getHttpServer());
  const registered = new Map<string, string>();

  beforeAll(async () => {
    app = await startApp({ PLUGGY_WEBHOOK_SECRET: 's3cret' }, (builder) =>
      builder.overrideProvider(OpenFinanceGateway).useValue(gateway),
    );
  });

  afterAll(() => app.close());

  beforeEach(() => {
    gateway.failing = false;
    gateway.status = 'ACTIVE';
    gateway.transactions = [];
  });

  const uniqueItem = () => `item-${randomUUID()}`;
  const uniqueTx = () => `tx-${randomUUID()}`;

  const webhook = (secret: string | null, body: object) => {
    const call = http().post('/api/v1/webhooks/pluggy').send(body);
    return secret == null ? call : call.set('X-Webhook-Secret', secret);
  };

  const imported = async (month: string, scope: string) =>
    (
      (
        await http().get(
          `/api/v1/finance/entries?month=${month}&scope=${scope}`,
        )
      ).body as { description: string }[]
    ).map((e) => e.description);

  const connections = async () =>
    (await http().get('/api/v1/finance/connections')).body as Connection[];

  const connectionOf = async (item: string) =>
    (await connections()).find((c) => c.id === registered.get(item));

  const register = async (item: string, scope: string) => {
    const id = await create(app, '/api/v1/finance/connections', {
      itemId: item,
      scope,
    });
    registered.set(item, id);
    return id;
  };

  const sync = (id: string) =>
    http().post(`/api/v1/finance/connections/${id}/sync`);

  it('follows the gateway for availability', async () => {
    expect(
      (await http().get('/api/v1/finance/connections/availability')).body,
    ).toEqual({
      enabled: true,
    });
  });

  it('puts the owner and the chosen scope in the token', async () => {
    const token = await http()
      .post('/api/v1/finance/connections/token')
      .send({ scope: 'business' });
    expect(token.status).toBe(200);
    expect(token.body).toEqual({
      accessToken: `token-for-${OWNER}:BUSINESS`,
      itemId: null,
    });
    expect(
      (await http().post('/api/v1/finance/connections/token').send({})).status,
    ).toBe(400);
  });

  it('imports in the chosen scope without duplicates (RN-16, RN-20)', async () => {
    gateway.transactions.push(expense(uniqueTx(), '2031-05-10'));
    const item = uniqueItem();

    const id = await register(item, 'business');

    await eventually(async () =>
      (await imported('2031-05', 'business')).includes('Mercado'),
    );
    expect(await imported('2031-05', 'personal')).not.toContain('Mercado');
    const connection = await connectionOf(item);
    expect(connection).toMatchObject({
      institution: 'Banco Teste',
      scope: 'business',
      status: 'active',
      accounts: [
        {
          externalId: 'acc',
          name: 'Conta',
          type: 'bank',
          balance: 10,
          currency: 'BRL',
        },
      ],
    });

    const again = await sync(id);
    expect(again.status).toBe(200);
    expect(again.body.imported).toBe(0);
    expect(await imported('2031-05', 'business')).toHaveLength(1);

    gateway.transactions.push(expense(uniqueTx(), '2031-05-11'));
    expect((await sync(id)).body.imported).toBe(1);
  });

  it('returns the same connection when registering twice', async () => {
    const item = uniqueItem();
    expect(await register(item, 'personal')).toBe(
      await register(item, 'personal'),
    );
  });

  it('reports a provider failure on the connection', async () => {
    const item = uniqueItem();
    const id = await register(item, 'personal');
    await eventually(
      async () => (await connectionOf(item))?.lastSyncedAt != null,
    );

    gateway.failing = true;
    const failed = await sync(id);

    expect(failed.status).toBe(200);
    expect(failed.body.connection.status).toBe('error');
    expect(failed.body.connection.lastError).toContain('fora do ar');
    expect(failed.body.connection.lastSyncedAt).toMatch(/Z$/);

    gateway.failing = false;
    expect((await sync(id)).body.connection.status).toBe('active');
  });

  it('shows a bank asking for login as needing reconnect', async () => {
    const id = await register(uniqueItem(), 'personal');
    gateway.status = 'NEEDS_RECONNECT';

    await eventually(
      async () => (await sync(id)).body.connection.status === 'needs_reconnect',
    );
  });

  it('needs the secret on webhooks', async () => {
    const body = { event: 'item/updated', itemId: 'x' };
    expect((await webhook(null, body)).status).toBe(401);
    expect((await webhook('wrong', body)).status).toBe(401);
    expect((await webhook('s3cret', body)).status).toBe(204);
  });

  it('registers a new connection from the webhook alone, with the scope of the token', async () => {
    gateway.transactions.push(expense(uniqueTx(), '2031-06-10'));
    const item = uniqueItem();

    expect(
      (
        await webhook('s3cret', {
          event: 'item/updated',
          itemId: item,
          clientUserId: `${OWNER}:BUSINESS`,
          eventId: 'ignored',
        })
      ).status,
    ).toBe(204);

    await eventually(async () =>
      (await imported('2031-06', 'business')).includes('Mercado'),
    );
    const id = await register(item, 'business');
    expect((await connections()).filter((c) => c.id === id)).toHaveLength(1);
  });

  it('ignores webhooks for unknown connections without a valid claim', async () => {
    const before = (await connections()).length;
    expect(
      (
        await webhook('s3cret', {
          event: 'item/updated',
          itemId: uniqueItem(),
          clientUserId: 'someone',
        })
      ).status,
    ).toBe(204);
    expect(
      (await webhook('s3cret', { event: 'some/other', itemId: 'x' })).status,
    ).toBe(204);
    expect(await connections()).toHaveLength(before);
  });

  it('removes entries deleted at the provider from the cash flow', async () => {
    const tx = uniqueTx();
    gateway.transactions.push(expense(tx, '2031-07-10'));
    const item = uniqueItem();
    await register(item, 'personal');
    await eventually(async () =>
      (await imported('2031-07', 'personal')).includes('Mercado'),
    );

    expect(
      (
        await webhook('s3cret', {
          event: 'transactions/deleted',
          itemId: item,
          transactionIds: [tx],
        })
      ).status,
    ).toBe(204);

    expect(await imported('2031-07', 'personal')).not.toContain('Mercado');
  });

  it('keeps imported entries and revokes at the provider on disconnect', async () => {
    gateway.transactions.push(expense(uniqueTx(), '2031-08-10'));
    const item = uniqueItem();
    const id = await register(item, 'personal');
    await eventually(async () =>
      (await imported('2031-08', 'personal')).includes('Mercado'),
    );

    expect(
      (await http().delete(`/api/v1/finance/connections/${id}`)).status,
    ).toBe(204);

    expect(gateway.deleted).toContain(item);
    expect((await sync(id)).status).toBe(404);
    expect(await imported('2031-08', 'personal')).toContain('Mercado');
  });

  it('removes the connection when the item is deleted at the provider', async () => {
    const item = uniqueItem();
    const id = await register(item, 'personal');

    expect(
      (await webhook('s3cret', { event: 'item/deleted', itemId: item })).status,
    ).toBe(204);

    expect((await sync(id)).status).toBe(404);
  });

  it('points the reconnect token at the existing item', async () => {
    const item = uniqueItem();
    const id = await register(item, 'business');

    const token = await http().post(`/api/v1/finance/connections/${id}/token`);

    expect(token.status).toBe(200);
    expect(token.body).toEqual({
      accessToken: `token-for-${OWNER}:BUSINESS`,
      itemId: item,
    });
  });
});
