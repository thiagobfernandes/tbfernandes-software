import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import {
  MonthSnapshot,
  MonthSnapshotRepository,
  PlanningSettings,
  PlanningSettingsRepository,
} from '../../domain';
import {
  MonthSnapshotPersistenceMapper,
  PlanningSettingsPersistenceMapper as Mapper,
} from './mappers/planning.persistence-mapper';
import {
  MonthSnapshotEntity,
  PlanningSettingsEntity,
} from './planning.entities';

@Injectable()
export class TypeOrmPlanningSettingsRepository extends PlanningSettingsRepository {
  private readonly rows: BaseRepository<PlanningSettingsEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(PlanningSettingsEntity, tx);
  }

  async save(settings: PlanningSettings): Promise<PlanningSettings> {
    const existing = await this.rows.findOwned(settings.ownerId, settings.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(settings, existing ?? undefined),
      ),
    );
  }

  async find(ownerId: string): Promise<PlanningSettings | null> {
    const entity = await this.rows.repository.findOneBy({ ownerId });
    return entity && Mapper.toDomain(entity);
  }
}

@Injectable()
export class TypeOrmMonthSnapshotRepository extends MonthSnapshotRepository {
  private readonly rows: BaseRepository<MonthSnapshotEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(MonthSnapshotEntity, tx);
  }

  async saveIfAbsent(snapshot: MonthSnapshot): Promise<void> {
    await this.tx.manager.query(
      `INSERT INTO finance.month_snapshot (id, owner_id, month, taken_on, lines)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_id, month) DO NOTHING`,
      [
        snapshot.id,
        snapshot.ownerId,
        snapshot.month,
        snapshot.takenOn,
        JSON.stringify(snapshot.lines),
      ],
    );
  }

  async find(ownerId: string, month: string): Promise<MonthSnapshot | null> {
    const entity = await this.rows.repository.findOneBy({ ownerId, month });
    return entity && MonthSnapshotPersistenceMapper.toDomain(entity);
  }
}
