import { Injectable } from '@nestjs/common';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import {
  EntryFilter,
  FinanceEntry,
  FinanceEntryRepository,
} from '../../domain';
import { FinanceEntryEntity } from './finance-entry.entity';
import { FinanceEntryPersistenceMapper as Mapper } from './mappers/finance-entry.persistence-mapper';

@Injectable()
export class TypeOrmFinanceEntryRepository extends FinanceEntryRepository {
  private readonly rows: BaseRepository<FinanceEntryEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(FinanceEntryEntity, tx);
  }

  async create(entry: FinanceEntry): Promise<FinanceEntry> {
    await this.rows.insertEntity(Mapper.toEntity(entry));
    return entry;
  }

  async save(entry: FinanceEntry): Promise<FinanceEntry> {
    const existing = await this.rows.findOwned(entry.ownerId, entry.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(entry, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<FinanceEntry | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string, filter: EntryFilter): Promise<FinanceEntry[]> {
    const where: FindOptionsWhere<FinanceEntryEntity> = {};
    const { from, to, scope } = filter;
    if (from && to) where.entryDate = Between(from, to);
    else if (from) where.entryDate = MoreThanOrEqual(from);
    else if (to) where.entryDate = LessThanOrEqual(to);
    if (scope) where.scope = scope;
    const rows = await this.rows.findAllOwned(ownerId, {
      where,
      order: { entryDate: 'DESC', createdAt: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  existsExternal(ownerId: string, externalId: string): Promise<boolean> {
    return this.rows.existsOwned(ownerId, { externalId });
  }

  delete(entry: FinanceEntry): Promise<void> {
    return this.rows.deleteOwned(entry.ownerId, entry.id);
  }

  async deleteImported(ownerId: string, externalIds: string[]): Promise<void> {
    if (!externalIds.length) return;
    await this.rows.repository.delete({ ownerId, externalId: In(externalIds) });
  }
}
