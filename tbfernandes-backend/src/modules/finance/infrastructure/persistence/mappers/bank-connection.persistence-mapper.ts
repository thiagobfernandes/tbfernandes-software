import { BankConnection } from '../../../domain';
import {
  BankAccountEntity,
  BankConnectionEntity,
} from '../bank-connection.entity';

export const BankConnectionPersistenceMapper = {
  toDomain(entity: BankConnectionEntity): BankConnection {
    return BankConnection.restore(
      entity.id,
      entity.ownerId,
      entity.externalId,
      {
        institution: entity.institution,
        scope: entity.scope,
        status: entity.status,
        lastSyncedAt: entity.lastSyncedAt,
        lastError: entity.lastError,
        accounts: (entity.accounts ?? []).map((accountEntity) => ({
          externalId: accountEntity.externalId,
          name: accountEntity.name,
          type: accountEntity.type,
          balance: accountEntity.balance,
          currency: accountEntity.currency,
        })),
      },
    );
  },

  toEntity(
    connection: BankConnection,
    entity: BankConnectionEntity = new BankConnectionEntity(),
  ): BankConnectionEntity {
    const details = connection.details;
    entity.id = connection.id;
    entity.ownerId = connection.ownerId;
    entity.externalId = connection.externalId;
    entity.institution = details.institution;
    entity.scope = details.scope;
    entity.status = details.status;
    entity.lastSyncedAt = details.lastSyncedAt;
    entity.lastError = details.lastError;
    delete entity.accounts;
    return entity;
  },

  toAccountEntities(connection: BankConnection): BankAccountEntity[] {
    return connection.details.accounts.map((account) =>
      Object.assign(new BankAccountEntity(), {
        connectionId: connection.id,
        externalId: account.externalId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
      }),
    );
  },
};
