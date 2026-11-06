import { IsoDate } from '../../../common/domain';
import { AccountType, Cents, ConnectionStatus } from '../domain';

export interface ConnectToken {
  accessToken: string;
}

export interface ExternalConnection {
  id: string;
  institution: string;
  status: ConnectionStatus;
}

export interface ExternalAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: Cents | null;
  currency: string | null;
}

/** amount is signed for cash flow, whatever the provider's convention: negative means money out. */
export interface ExternalTransaction {
  id: string;
  accountId: string;
  date: IsoDate;
  description: string | null;
  amount: Cents;
  currency: string | null;
  category: string | null;
}

/**
 * An open finance aggregator (Pluggy first). Use cases depend only on this class, so the
 * provider can change without touching them. Calls throw ExternalServiceError when the
 * provider fails.
 */
export abstract class OpenFinanceGateway {
  abstract enabled(): boolean;
  /**
   * Short-lived token the frontend passes to the provider's connect widget.
   * @param clientUserId comes back in the provider's webhooks
   * @param connectionId the connection to log in again, or null for a new one
   */
  abstract createConnectToken(
    clientUserId: string,
    connectionId: string | null,
  ): Promise<ConnectToken>;
  abstract getConnection(connectionId: string): Promise<ExternalConnection>;
  /** Accounts of one connection (Pluggy calls a connection an "item"). */
  abstract listAccounts(connectionId: string): Promise<ExternalAccount[]>;
  /** Settled transactions of one account, both dates inclusive. */
  abstract listTransactions(
    account: ExternalAccount,
    from: IsoDate,
    to: IsoDate,
  ): Promise<ExternalTransaction[]>;
  /** Revokes the connection at the provider. A connection already gone is not a failure. */
  abstract deleteConnection(connectionId: string): Promise<void>;
}
