import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { TimeEntry, TimeEntryRepository } from '../../domain';
import { TimeEntryPersistenceMapper as Mapper } from './mappers/time-entry.persistence-mapper';
import { TimeEntryEntity } from './time-entry.entity';

@Injectable()
export class TypeOrmTimeEntryRepository extends TimeEntryRepository {
  private readonly rows: BaseRepository<TimeEntryEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(TimeEntryEntity, tx);
  }

  async create(entry: TimeEntry): Promise<TimeEntry> {
    await this.rows.insertEntity(Mapper.toEntity(entry));
    return entry;
  }

  async save(entry: TimeEntry): Promise<TimeEntry> {
    const existing = await this.rows.findOwned(entry.ownerId, entry.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(entry, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<TimeEntry | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<TimeEntry[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { startedAt: 'DESC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  async findRunning(ownerId: string): Promise<TimeEntry | null> {
    const [row] = await this.rows.findAllOwned(ownerId, {
      where: { endedAt: IsNull() },
    });
    return row ? Mapper.toDomain(row) : null;
  }

  async findTouching(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<TimeEntry[]> {
    const rows = await this.rows.repository
      .createQueryBuilder('entry')
      .where('entry.owner_id = :ownerId', { ownerId })
      .andWhere('entry.started_at < :to', { to })
      .andWhere('(entry.ended_at IS NULL OR entry.ended_at > :from)', { from })
      .getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(entry: TimeEntry): Promise<void> {
    return this.rows.deleteOwned(entry.ownerId, entry.id);
  }
}
