import { FinanceEntry } from '../../../domain';
import { FinanceEntryEntity } from '../finance-entry.entity';

/** FinanceEntry ↔ finance.entry row. */
export const FinanceEntryPersistenceMapper = {
  toDomain(e: FinanceEntryEntity): FinanceEntry {
    return FinanceEntry.restore(
      e.id,
      e.ownerId,
      {
        kind: e.kind,
        scope: e.scope,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: e.entryDate,
        recurring: e.recurring,
      },
      e.source,
      e.externalId,
    );
  },

  toEntity(
    entry: FinanceEntry,
    e: FinanceEntryEntity = new FinanceEntryEntity(),
  ): FinanceEntryEntity {
    const d = entry.details;
    e.id = entry.id;
    e.ownerId = entry.ownerId;
    e.kind = d.kind;
    e.scope = d.scope;
    e.category = d.category;
    e.description = d.description;
    e.amount = d.amount;
    e.entryDate = d.date;
    e.recurring = d.recurring;
    e.source = entry.source;
    e.externalId = entry.externalId;
    return e;
  },
};
