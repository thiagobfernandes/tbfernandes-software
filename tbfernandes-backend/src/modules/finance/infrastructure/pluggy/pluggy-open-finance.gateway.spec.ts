import { Clock } from '../../../../common/application';
import { ExternalServiceError } from '../../../../common/domain';
import { ExternalAccount } from '../../application/open-finance.gateway';
import { PluggyOpenFinanceGateway } from './pluggy-open-finance.gateway';

const BASE = 'https://pluggy.test';

interface Expectation {
  url: string;
  method?: string;
  key?: string;
  body?: (body: Record<string, unknown>) => void;
  status?: number;
  json?: unknown;
}

class FakePluggy {
  private readonly expected: Expectation[] = [];

  expect(expectation: Expectation): this {
    this.expected.push(expectation);
    return this;
  }

  expectAuth(key: string): this {
    return this.expect({
      url: `${BASE}/auth`,
      method: 'POST',
      body: (body) =>
        expect(body).toEqual({ clientId: 'id', clientSecret: 'secret' }),
      json: { apiKey: key },
    });
  }

  readonly fetch = ((url: string, init: RequestInit) => {
    const expectation = this.expected.shift();
    if (!expectation) throw new Error(`Unexpected request ${url}`);
    expect(url).toBe(expectation.url);
    if (expectation.method) expect(init.method).toBe(expectation.method);
    const headers = init.headers as Record<string, string>;
    if (expectation.key) expect(headers['X-API-KEY']).toBe(expectation.key);
    if (expectation.body)
      expectation.body(
        JSON.parse(init.body as string) as Record<string, unknown>,
      );
    const status = expectation.status ?? 200;
    return Promise.resolve(
      new Response(
        expectation.json === undefined
          ? null
          : JSON.stringify(expectation.json),
        {
          status,
        },
      ),
    );
  }) as unknown as typeof fetch;

  verify(): void {
    expect(this.expected).toEqual([]);
  }
}

const clock: Clock = {
  now: () => new Date(),
  today: () => '2031-03-05',
  startOfWeek: () => new Date(),
};

const CHECKING: ExternalAccount = {
  id: 'acc',
  name: 'Conta',
  type: 'BANK',
  balance: 1000,
  currency: 'BRL',
};
const CARD: ExternalAccount = { ...CHECKING, id: 'card', type: 'CREDIT' };

const tx = (overrides: Record<string, unknown>) => ({
  date: '2031-03-05T00:00:00.000Z',
  currencyCode: 'BRL',
  status: 'POSTED',
  ...overrides,
});

describe('PluggyOpenFinanceGateway', () => {
  let pluggy: FakePluggy;
  let gateway: PluggyOpenFinanceGateway;

  beforeEach(() => {
    pluggy = new FakePluggy();
    gateway = new PluggyOpenFinanceGateway(
      {
        enabled: true,
        baseUrl: BASE,
        clientId: 'id',
        clientSecret: 'secret',
        webhookSecret: '',
      },
      clock,
      pluggy.fetch,
    );
  });

  it('reuses the API key and sends the clientUserId', async () => {
    pluggy
      .expectAuth('key-1')
      .expect({
        url: `${BASE}/connect_token`,
        method: 'POST',
        key: 'key-1',
        body: (body) =>
          expect(body).toEqual({
            options: { clientUserId: 'me', avoidDuplicates: true },
          }),
        json: { accessToken: 'tok-1' },
      })
      .expect({
        url: `${BASE}/connect_token`,
        key: 'key-1',
        body: (body) => expect(body.itemId).toBe('item'),
        json: { accessToken: 'tok-2' },
      });

    expect((await gateway.createConnectToken('me', null)).accessToken).toBe(
      'tok-1',
    );
    expect((await gateway.createConnectToken('me', 'item')).accessToken).toBe(
      'tok-2',
    );
    pluggy.verify();
  });

  it('asks for a new key once when the key is refused', async () => {
    pluggy
      .expectAuth('old')
      .expect({ url: `${BASE}/connect_token`, key: 'old', status: 401 })
      .expectAuth('new')
      .expect({
        url: `${BASE}/connect_token`,
        key: 'new',
        json: { accessToken: 'tok' },
      });

    expect((await gateway.createConnectToken('me', null)).accessToken).toBe(
      'tok',
    );
    pluggy.verify();
  });

  it('turns a provider failure into ExternalServiceError without secrets', async () => {
    pluggy.expectAuth('key').expect({ url: `${BASE}/items/item`, status: 502 });

    const failure = gateway.getConnection('item');
    await expect(failure).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(failure).rejects.toThrow(/Pluggy/);
    await expect(failure).rejects.not.toThrow(/secret/);
  });

  it('maps the item status and the institution', async () => {
    pluggy
      .expectAuth('key')
      .expect({
        url: `${BASE}/items/a`,
        json: {
          id: 'a',
          status: 'UPDATED',
          connector: { id: 1, name: 'Nubank' },
          extra: true,
        },
      })
      .expect({
        url: `${BASE}/items/b`,
        json: { id: 'b', status: 'LOGIN_ERROR', connector: { name: 'Itaú' } },
      })
      .expect({
        url: `${BASE}/items/c`,
        json: { id: 'c', status: 'OUTDATED' },
      });

    expect(await gateway.getConnection('a')).toEqual({
      id: 'a',
      institution: 'Nubank',
      status: 'ACTIVE',
    });
    expect((await gateway.getConnection('b')).status).toBe('NEEDS_RECONNECT');
    expect(await gateway.getConnection('c')).toMatchObject({
      institution: 'Banco',
      status: 'ERROR',
    });
  });

  it('lists accounts', async () => {
    pluggy.expectAuth('key').expect({
      url: `${BASE}/accounts?itemId=item`,
      json: {
        page: 1,
        results: [
          {
            id: 'a1',
            name: 'Conta Corrente',
            type: 'BANK',
            balance: 100.5,
            currencyCode: 'BRL',
          },
          {
            id: 'a2',
            name: 'Cartão',
            type: 'CREDIT',
            balance: 20,
            currencyCode: 'BRL',
          },
        ],
      },
    });

    const accounts = await gateway.listAccounts('item');

    expect(accounts.map((account) => account.type)).toEqual(['BANK', 'CREDIT']);
    expect(accounts[0].balance).toBe(10050);
  });

  it('follows the cursor and leaves out pending transactions', async () => {
    pluggy
      .expectAuth('key')
      .expect({
        url: `${BASE}/v2/transactions?accountId=acc&dateFrom=2031-01-01&dateTo=2031-03-31`,
        json: {
          results: [
            tx({
              id: 't1',
              description: 'Mercado',
              amount: -10.5,
              type: 'DEBIT',
              category: 'Food',
            }),
            tx({
              id: 't2',
              description: 'Agendado',
              amount: -5,
              type: 'DEBIT',
              status: 'PENDING',
            }),
          ],
          next: '?accountId=acc&after=abc%3D',
        },
      })
      .expect({
        url: `${BASE}/v2/transactions?accountId=acc&after=abc%3D`,
        key: 'key',
        json: {
          results: [
            tx({
              id: 't3',
              date: '2031-03-07T00:00:00.000Z',
              amount: 99,
              type: 'CREDIT',
            }),
          ],
          next: null,
        },
      });

    const transactions = await gateway.listTransactions(
      CHECKING,
      '2031-01-01',
      '2031-03-31',
    );

    expect(transactions.map((transaction) => transaction.id)).toEqual([
      't1',
      't3',
    ]);
    expect(transactions[0]).toMatchObject({
      date: '2031-03-05',
      amount: -1050,
      category: 'Food',
    });
    expect(transactions[1].amount).toBe(9900);
    pluggy.verify();
  });

  it('on a card a positive amount is money out, and foreign purchases use the account currency', async () => {
    pluggy.expectAuth('key').expect({
      url: `${BASE}/v2/transactions?accountId=card&dateFrom=2031-01-01&dateTo=2031-03-31`,
      json: {
        results: [
          tx({ id: 'c1', amount: 50, type: 'CREDIT' }),
          tx({ id: 'c2', amount: -50, type: 'DEBIT' }),
          tx({
            id: 'c3',
            amount: 10,
            amountInAccountCurrency: 55.3,
            currencyCode: 'USD',
            type: 'CREDIT',
          }),
        ],
        next: null,
      },
    });

    const transactions = await gateway.listTransactions(
      CARD,
      '2031-01-01',
      '2031-03-31',
    );

    expect(transactions.map((transaction) => transaction.amount)).toEqual([
      -5000, 5000, -5530,
    ]);
  });

  it('does not fail when the connection to delete is already gone', async () => {
    pluggy
      .expectAuth('key')
      .expect({ url: `${BASE}/items/gone`, method: 'DELETE', status: 404 });

    await gateway.deleteConnection('gone');
    pluggy.verify();
  });
});
