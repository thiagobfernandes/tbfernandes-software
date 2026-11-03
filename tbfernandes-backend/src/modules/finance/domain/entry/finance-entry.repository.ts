import { IsoDate } from '../../../../common/domain';
import { EntryScope, FinanceEntry } from './finance-entry';

export interface EntryFilter {
  /** Both dates inclusive. */
  from?: IsoDate | null;
  to?: IsoDate | null;
  scope?: EntryScope | null;
}

/** Implemented in infrastructure/persistence. */
export abstract class FinanceEntryRepository {
  abstract create(entry: FinanceEntry): Promise<FinanceEntry>;
  abstract save(entry: FinanceEntry): Promise<FinanceEntry>;
  abstract findById(ownerId: string, id: string): Promise<FinanceEntry | null>;
  /** Newest first. */
  abstract findAll(
    ownerId: string,
    filter: EntryFilter,
  ): Promise<FinanceEntry[]>;
  abstract existsExternal(
    ownerId: string,
    externalId: string,
  ): Promise<boolean>;
  abstract delete(entry: FinanceEntry): Promise<void>;
  /** Entries imported with these provider ids, gone at the provider. */
  abstract deleteImported(
    ownerId: string,
    externalIds: string[],
  ): Promise<void>;
}
