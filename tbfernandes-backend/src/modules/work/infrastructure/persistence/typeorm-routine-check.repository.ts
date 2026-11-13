import { Injectable } from '@nestjs/common';
import { IsoDate } from '../../../../common/domain';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { RoutineCheck, RoutineCheckRepository } from '../../domain';
import { RoutineCheckPersistenceMapper as Mapper } from './mappers/routine-check.persistence-mapper';
import { RoutineCheckEntity } from './routine-check.entity';

@Injectable()
export class TypeOrmRoutineCheckRepository extends RoutineCheckRepository {
  private readonly rows: BaseRepository<RoutineCheckEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(RoutineCheckEntity, tx);
  }

  async create(check: RoutineCheck): Promise<RoutineCheck> {
    await this.rows.insertEntity(Mapper.toEntity(check));
    return check;
  }

  async save(check: RoutineCheck): Promise<RoutineCheck> {
    const existing = await this.rows.findOwned(check.ownerId, check.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(check, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<RoutineCheck | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  exists(ownerId: string, routineId: string, date: IsoDate): Promise<boolean> {
    return this.rows.existsOwned(ownerId, { routineId, day: date });
  }

  async findAll(
    ownerId: string,
    filter: {
      routineId?: string | null;
      from?: IsoDate | null;
      to?: IsoDate | null;
    } = {},
  ): Promise<RoutineCheck[]> {
    const query = this.rows.repository
      .createQueryBuilder('routineCheck')
      .where('routineCheck.owner_id = :ownerId', { ownerId })
      .orderBy('routineCheck.day', 'DESC');
    if (filter.routineId)
      query.andWhere('routineCheck.routine_id = :routineId', {
        routineId: filter.routineId,
      });
    if (filter.from)
      query.andWhere('routineCheck.day >= :from', { from: filter.from });
    if (filter.to) query.andWhere('routineCheck.day <= :to', { to: filter.to });
    return (await query.getMany()).map((row) => Mapper.toDomain(row));
  }

  delete(check: RoutineCheck): Promise<void> {
    return this.rows.deleteOwned(check.ownerId, check.id);
  }
}
