import { Clock } from '../../../../common/application';
import {
  BusinessRuleViolationError,
  ExternalServiceError,
  IsoDate,
} from '../../../../common/domain';
import type { PluggyConfig } from '../../../../infrastructure/environments/registers';
import { Logger } from '../../../../infrastructure/logger';
import {
  ConnectToken,
  ExternalAccount,
  ExternalConnection,
  ExternalTransaction,
  OpenFinanceGateway,
} from '../../application/open-finance.gateway';
import { AccountType, ConnectionStatus, Money } from '../../domain';

/** Renews before the 2 hours end, so a key never expires in the middle of a sync. */
const API_KEY_LIFETIME_MS = 110 * 60 * 1000;
const FAILURE =
  'Não foi possível falar com a Pluggy; tente de novo em instantes';

interface ItemResponse {
  id: string;
  status: string;
  connector?: { name: string } | null;
}

interface AccountResponse {
  id: string;
  name: string;
  type: string;
  balance: number | null;
  currencyCode: string | null;
}

interface TransactionResponse {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  amountInAccountCurrency: number | null;
  currencyCode: string | null;
  type: string;
  status: string | null;
  category: string | null;
}

interface Page<T> {
  results: T[];
  next?: string | null;
}

/** An HTTP answer Pluggy gave that is not a success. */
class PluggyHttpError extends Error {
  constructor(readonly status: number) {
    super(`Pluggy answered ${status}`);
  }
}

/**
 * Pluggy, active with PLUGGY_ENABLED=true. Contract: https://docs.pluggy.ai
 * - POST /auth returns an API key valid for 2 hours, reused because /auth is rate limited;
 * - POST /connect_token returns the token for the Pluggy Connect widget;
 * - GET /items/{id}, GET /accounts?itemId=..., DELETE /items/{id};
 * - GET /v2/transactions is paged by cursor ("next"); the page-numbered GET /transactions is
 *   removed after 2026-12-31.
 */
export class PluggyOpenFinanceGateway extends OpenFinanceGateway {
  private apiKey: string | null = null;
  private apiKeyExpiresAt = 0;
  private renewing: Promise<string> | null = null;

  constructor(
    private readonly config: PluggyConfig,
    private readonly clock: Clock,
    private readonly http: typeof fetch = fetch,
  ) {
    super();
    if (!config.clientId || !config.clientSecret) {
      throw new Error(
        'PLUGGY_ENABLED=true needs PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET',
      );
    }
  }

  enabled(): boolean {
    return true;
  }

  async createConnectToken(
    clientUserId: string,
    connectionId: string | null,
  ): Promise<ConnectToken> {
    // avoidDuplicates: logging in to the same bank twice must not create a second item.
    const body: Record<string, unknown> = {
      options: { clientUserId, avoidDuplicates: true },
    };
    if (connectionId != null) body.itemId = connectionId;
    const token = await this.call<{ accessToken: string }>(
      'POST',
      '/connect_token',
      body,
    );
    return { accessToken: token.accessToken };
  }

  async getConnection(connectionId: string): Promise<ExternalConnection> {
    const item = await this.call<ItemResponse>(
      'GET',
      `/items/${encodeURIComponent(connectionId)}`,
    );
    return {
      id: item.id,
      institution: item.connector?.name ?? 'Banco',
      status: PluggyOpenFinanceGateway.status(item.status),
    };
  }

  async listAccounts(connectionId: string): Promise<ExternalAccount[]> {
    const page = await this.call<Page<AccountResponse>>(
      'GET',
      `/accounts?${new URLSearchParams({ itemId: connectionId })}`,
    );
    return page.results.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type as AccountType,
      balance: a.balance == null ? null : Money.cents(a.balance),
      currency: a.currencyCode ?? null,
    }));
  }

  async listTransactions(
    account: ExternalAccount,
    from: IsoDate,
    to: IsoDate,
  ): Promise<ExternalTransaction[]> {
    const transactions: ExternalTransaction[] = [];
    let path = `/v2/transactions?${new URLSearchParams({
      accountId: account.id,
      dateFrom: from,
      dateTo: to,
    })}`;
    for (;;) {
      const page = await this.call<Page<TransactionResponse>>('GET', path);
      for (const t of page.results) {
        if (t.status !== 'PENDING')
          transactions.push(PluggyOpenFinanceGateway.toTransaction(account, t));
      }
      if (!page.next) return transactions;
      // "next" is the ready-to-use query string, so it is not encoded again.
      path = `/v2/transactions${page.next}`;
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await this.call('DELETE', `/items/${encodeURIComponent(connectionId)}`);
    } catch (error) {
      if (!(error instanceof ExternalServiceError)) throw error;
      const cause = error.cause;
      if (!(cause instanceof PluggyHttpError && cause.status === 404))
        throw error;
    }
  }

  private static toTransaction(
    account: ExternalAccount,
    t: TransactionResponse,
  ): ExternalTransaction {
    const value = Math.abs(Money.cents(t.amountInAccountCurrency ?? t.amount));
    return {
      id: t.id,
      accountId: account.id,
      date: new Date(t.date).toISOString().slice(0, 10),
      description: t.description,
      amount: PluggyOpenFinanceGateway.moneyOut(account, t) ? -value : value,
      currency: t.currencyCode ?? null,
      category: t.category ?? null,
    };
  }

  /** On a card a positive amount is a new charge and a negative one a payment; on a bank account "type" tells. */
  private static moneyOut(account: ExternalAccount, t: TransactionResponse) {
    return account.type === 'CREDIT' ? t.amount > 0 : t.type === 'DEBIT';
  }

  private static status(itemStatus: string): ConnectionStatus {
    switch (itemStatus) {
      case 'UPDATED':
      case 'UPDATING':
        return 'ACTIVE';
      case 'LOGIN_ERROR':
      case 'WAITING_USER_INPUT':
      case 'WAITING_USER_ACTION':
        return 'NEEDS_RECONNECT';
      default:
        return 'ERROR';
    }
  }

  /** Runs a request with the current key and, if Pluggy refuses it, once more with a new one. */
  private async call<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    try {
      try {
        return await this.request<T>(method, path, await this.key(false), body);
      } catch (error) {
        if (!(error instanceof PluggyHttpError && error.status === 401))
          throw error;
        return await this.request<T>(method, path, await this.key(true), body);
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) throw error;
      Logger.warn(
        `Pluggy request failed: ${method} ${path.split('?')[0]} (${
          error instanceof Error ? error.message : 'unknown error'
        })`,
      );
      throw new ExternalServiceError(FAILURE, error);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    apiKey: string | null,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['X-API-KEY'] = apiKey;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await this.http(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new PluggyHttpError(response.status);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** One /auth at a time: concurrent syncs wait for the same new key. */
  private key(renew: boolean): Promise<string> {
    const now = this.clock.now().getTime();
    if (!renew && this.apiKey && now < this.apiKeyExpiresAt)
      return Promise.resolve(this.apiKey);
    this.renewing ??= this.request<{ apiKey: string }>('POST', '/auth', null, {
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    })
      .then((auth) => {
        this.apiKey = auth.apiKey;
        this.apiKeyExpiresAt = now + API_KEY_LIFETIME_MS;
        return auth.apiKey;
      })
      .finally(() => {
        this.renewing = null;
      });
    return this.renewing;
  }
}
