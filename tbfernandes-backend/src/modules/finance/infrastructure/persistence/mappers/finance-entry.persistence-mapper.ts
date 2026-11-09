import { FinanceEntry } from '../../../domain';
import { FinanceEntryEntity } from '../finance-entry.entity';

export const FinanceEntryPersistenceMapper = {
  toDomain(entity: FinanceEntryEntity): FinanceEntry {
    return FinanceEntry.restore(
      entity.id,
      entity.ownerId,
      {
        kind: entity.kind,
        scope: entity.scope,
        category: entity.category,
        description: entity.description,
        amount: entity.amount,
        date: entity.entryDate,
        recurring: entity.recurring,
      },
      entity.source,
      entity.externalId,
    );
  },

  toEntity(
    entry: FinanceEntry,
    entity: FinanceEntryEntity = new FinanceEntryEntity(),
  ): FinanceEntryEntity {
    const details = entry.details;
    entity.id = entry.id;
    entity.ownerId = entry.ownerId;
    entity.kind = details.kind;
    entity.scope = details.scope;
    entity.category = details.category;
    entity.description = details.description;
    entity.amount = details.amount;
    entity.entryDate = details.date;
    entity.recurring = details.recurring;
    entity.source = entry.source;
    entity.externalId = entry.externalId;
    return entity;
  },
};
