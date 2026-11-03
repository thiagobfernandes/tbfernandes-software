import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError, YearMonth, YearMonths } from '../../../common/domain';
import {
  EntryDetails,
  EntryScope,
  FinanceEntry,
  FinanceEntryRepository,
} from '../domain';

/** Manual cash flow entries (RF-FIN-01). Imported ones come from OpenFinanceService. */
@Injectable()
export class FinanceEntryService {
  constructor(
    private readonly entries: FinanceEntryRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: EntryDetails): Promise<FinanceEntry> {
    return this.entries.create(
      FinanceEntry.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: EntryDetails): Promise<FinanceEntry> {
    return this.uow.run(async () => {
      const entry = await this.get(id);
      entry.update(details);
      return this.entries.save(entry);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.entries.delete(await this.get(id)));
  }

  async get(id: string): Promise<FinanceEntry> {
    const entry = await this.entries.findById(this.owner.currentOwnerId(), id);
    if (!entry) throw new NotFoundError('O lançamento', id);
    return entry;
  }

  /** Newest first; without a month, all of them. */
  list(
    month: YearMonth | null,
    scope: EntryScope | null,
  ): Promise<FinanceEntry[]> {
    return this.entries.findAll(this.owner.currentOwnerId(), {
      from: month && YearMonths.firstDay(month),
      to: month && YearMonths.lastDay(month),
      scope,
    });
  }
}
