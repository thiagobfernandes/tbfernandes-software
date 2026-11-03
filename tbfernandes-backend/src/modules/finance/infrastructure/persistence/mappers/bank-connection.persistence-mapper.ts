import { BankConnection } from '../../../domain';
import {
  BankAccountEntity,
  BankConnectionEntity,
} from '../bank-connection.entity';

/** BankConnection ↔ finance.bank_connection and finance.bank_account rows. */
export const BankConnectionPersistenceMapper = {
  toDomain(e: BankConnectionEntity): BankConnection {
    return BankConnection.restore(e.id, e.ownerId, e.externalId, {
      institution: e.institution,
      scope: e.scope,
      status: e.status,
      lastSyncedAt: e.lastSyncedAt,
      lastError: e.lastError,
      accounts: (e.accounts ?? []).map((a) => ({
        externalId: a.externalId,
        name: a.name,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
      })),
    });
  },

  toEntity(
    connection: BankConnection,
    e: BankConnectionEntity = new BankConnectionEntity(),
  ): BankConnectionEntity {
    const d = connection.details;
    e.id = connection.id;
    e.ownerId = connection.ownerId;
    e.externalId = connection.externalId;
    e.institution = d.institution;
    e.scope = d.scope;
    e.status = d.status;
    e.lastSyncedAt = d.lastSyncedAt;
    e.lastError = d.lastError;
    delete e.accounts;
    return e;
  },

  toAccountEntities(connection: BankConnection): BankAccountEntity[] {
    return connection.details.accounts.map((a) =>
      Object.assign(new BankAccountEntity(), {
        connectionId: connection.id,
        externalId: a.externalId,
        name: a.name,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
      }),
    );
  },
};
