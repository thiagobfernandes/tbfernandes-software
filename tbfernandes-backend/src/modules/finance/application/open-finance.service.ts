import { Injectable } from '@nestjs/common';
import {
  Clock,
  EventPublisher,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import {
  ConflictError,
  ExternalServiceError,
  IsoDates,
  NotFoundError,
  Require,
} from '../../../common/domain';
import {
  BankConnection,
  BankConnectionRepository,
  EntryScope,
  FinanceEntryRepository,
} from '../domain';
import { ConnectionClaims } from './connection-claim';
import {
  ConnectionSyncRequested,
  connectionSyncRequested,
} from './connection-sync-requested';
import {
  ConnectToken,
  ExternalAccount,
  ExternalConnection,
  ExternalTransaction,
  OpenFinanceGateway,
} from './open-finance.gateway';

/** How far back every sync reads. Imports are idempotent (RN-16), so overlapping is harmless. */
export const HISTORY_DAYS = 90;

export interface SyncResult {
  imported: number;
  connection: BankConnection;
}

@Injectable()
export class OpenFinanceService {
  constructor(
    private readonly repository: BankConnectionRepository,
    private readonly entries: FinanceEntryRepository,
    private readonly gateway: OpenFinanceGateway,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  enabled(): boolean {
    return this.gateway.enabled();
  }

  connectToken(scope: EntryScope): Promise<ConnectToken> {
    const claim = {
      ownerId: this.owner.currentOwnerId(),
      scope: Require.present(scope, 'scope'),
    };
    return this.gateway.createConnectToken(
      ConnectionClaims.encode(claim),
      null,
    );
  }

  /** Token to log in again to a bank that asked for it, keeping the same connection and imports. */
  async reconnectToken(
    id: string,
  ): Promise<ConnectToken & { connectionId: string }> {
    const connection = await this.connection(id);
    const claim = {
      ownerId: connection.ownerId,
      scope: connection.details.scope,
    };
    const token = await this.gateway.createConnectToken(
      ConnectionClaims.encode(claim),
      connection.externalId,
    );
    return { ...token, connectionId: connection.externalId };
  }

  /** Called by the frontend when the widget succeeds; the webhook may already have registered it. */
  register(externalId: string, scope: EntryScope): Promise<BankConnection> {
    const ownerId = this.owner.currentOwnerId();
    return this.uow.run(async () => {
      const connection = await this.findOrRegister(
        Require.text(externalId, 'itemId', 120),
        ownerId,
        Require.present(scope, 'scope'),
      );
      if (connection.ownerId !== ownerId) {
        throw new ConflictError('RN-21', 'Esta conexão pertence a outra conta');
      }
      this.events.publish(connectionSyncRequested(externalId, ownerId, scope));
      return connection;
    });
  }

  connections(): Promise<BankConnection[]> {
    return this.repository.findAll(this.owner.currentOwnerId());
  }

  async connection(id: string): Promise<BankConnection> {
    const connection = await this.repository.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!connection) throw new NotFoundError('A conexão', id);
    return connection;
  }

  /** Manual sync, from the screen. A provider failure is reported on the connection, not as an error. */
  sync(id: string): Promise<SyncResult> {
    return this.uow.run(async () => {
      const connection = await this.locked(id);
      const imported = await this.importInto(connection);
      return { imported, connection: await this.repository.save(connection) };
    });
  }

  /** Stays connected at the provider if this fails. Imported entries are kept, they are the user's history. */
  disconnect(id: string): Promise<void> {
    return this.uow.run(async () => {
      const connection = await this.locked(id);
      await this.gateway.deleteConnection(connection.externalId);
      await this.repository.delete(connection);
    });
  }

  // Webhooks: the caller has proved it is the provider, and there is no signed-in owner.

  /**
   * The provider has new data or a new state for this connection.
   * @returns false when the connection is unknown and the webhook names no owner
   */
  async connectionChanged(
    externalId: string,
    clientUserId: string | null,
  ): Promise<boolean> {
    const existing = await this.repository.findByExternalId(externalId);
    if (existing) {
      this.events.publish(
        connectionSyncRequested(externalId, existing.ownerId, null),
      );
      return true;
    }
    const claim = ConnectionClaims.parse(clientUserId);
    if (!claim) return false;
    this.events.publish(
      connectionSyncRequested(externalId, claim.ownerId, claim.scope),
    );
    return true;
  }

  connectionDeleted(externalId: string): Promise<void> {
    return this.uow.run(async () => {
      const connection = await this.repository.lockByExternalId(externalId);
      if (connection) await this.repository.delete(connection);
    });
  }

  async transactionsDeleted(
    externalId: string,
    transactionIds: string[],
  ): Promise<void> {
    const connection = await this.repository.findByExternalId(externalId);
    if (connection && transactionIds.length)
      await this.entries.deleteImported(connection.ownerId, transactionIds);
  }

  syncRequested(event: ConnectionSyncRequested): Promise<void> {
    return this.uow.run(async () => {
      if (!(await this.repository.findByExternalId(event.externalId))) {
        if (event.scope == null) return;
        await this.findOrRegister(event.externalId, event.ownerId, event.scope);
      }
      // Gone between the request and now means it was disconnected: nothing to do.
      const connection = await this.repository.lockByExternalId(
        event.externalId,
      );
      if (!connection) return;
      await this.importInto(connection);
      await this.repository.save(connection);
    });
  }

  private async locked(id: string): Promise<BankConnection> {
    const { externalId } = await this.connection(id);
    const connection = await this.repository.lockByExternalId(externalId);
    if (!connection) throw new NotFoundError('A conexão', id);
    return connection;
  }

  private async findOrRegister(
    externalId: string,
    ownerId: string,
    scope: EntryScope,
  ): Promise<BankConnection> {
    const existing = await this.repository.findByExternalId(externalId);
    if (existing) return existing;
    const external = await this.gateway.getConnection(externalId);
    return this.repository.saveIfAbsent(
      BankConnection.connect(
        this.ids.newId(),
        ownerId,
        externalId,
        external.institution,
        scope,
        external.status,
      ),
    );
  }

  /** Reads everything first, so a provider failure leaves no half-finished import. */
  private async importInto(connection: BankConnection): Promise<number> {
    let external: ExternalConnection;
    let accounts: ExternalAccount[];
    const transactions: ExternalTransaction[] = [];
    try {
      const to = this.clock.today();
      const from = IsoDates.plusDays(to, -HISTORY_DAYS);
      external = await this.gateway.getConnection(connection.externalId);
      accounts = await this.gateway.listAccounts(connection.externalId);
      for (const account of accounts) {
        transactions.push(
          ...(await this.gateway.listTransactions(account, from, to)),
        );
      }
    } catch (error) {
      if (!(error instanceof ExternalServiceError)) throw error;
      connection.syncFailed(error.message);
      return 0;
    }
    let imported = 0;
    for (const transaction of transactions) {
      if (await this.entries.existsExternal(connection.ownerId, transaction.id))
        continue;
      const entry = connection.importEntry(
        this.ids.newId(),
        transaction.id,
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.category,
      );
      if (entry) {
        await this.entries.create(entry);
        imported++;
      }
    }
    connection.synced(
      external.institution,
      external.status,
      accounts.map((account) => ({
        externalId: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
      })),
      this.clock.now(),
    );
    return imported;
  }
}
