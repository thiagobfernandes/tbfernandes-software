import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Routine, RoutineRepository } from '../../domain';
import { RoutinePersistenceMapper as Mapper } from './mappers/routine.persistence-mapper';
import { RoutineEntity } from './routine.entity';

@Injectable()
export class TypeOrmRoutineRepository extends RoutineRepository {
  private readonly rows: BaseRepository<RoutineEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(RoutineEntity, tx);
  }

  async create(routine: Routine): Promise<Routine> {
    await this.rows.insertEntity(Mapper.toEntity(routine));
    return routine;
  }

  async save(routine: Routine): Promise<Routine> {
    const existing = await this.rows.findOwned(routine.ownerId, routine.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(routine, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Routine | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Routine[]> {
    const rows = await this.rows.repository
      .createQueryBuilder('routine')
      .where('routine.owner_id = :ownerId', { ownerId })
      .orderBy('routine.active', 'DESC')
      .addOrderBy('routine.start_time', 'ASC', 'NULLS LAST')
      .addOrderBy('routine.title', 'ASC')
      .getMany();
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(routine: Routine): Promise<void> {
    return this.rows.deleteOwned(routine.ownerId, routine.id);
  }
}
