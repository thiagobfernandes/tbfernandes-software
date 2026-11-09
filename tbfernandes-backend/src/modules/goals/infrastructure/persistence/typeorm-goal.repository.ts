import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Goal, GoalRepository } from '../../domain';
import { GoalEntity } from './goal.entity';
import { GoalPersistenceMapper as Mapper } from './mappers/goal.persistence-mapper';

@Injectable()
export class TypeOrmGoalRepository extends GoalRepository {
  private readonly rows: BaseRepository<GoalEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(GoalEntity, tx);
  }

  async create(goal: Goal): Promise<Goal> {
    await this.rows.insertEntity(Mapper.toEntity(goal));
    return goal;
  }

  async save(goal: Goal): Promise<Goal> {
    const existing = await this.rows.findOwned(goal.ownerId, goal.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(Mapper.toEntity(goal, existing ?? undefined)),
    );
  }

  async findById(ownerId: string, id: string): Promise<Goal | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string): Promise<Goal[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      order: { dueDate: { direction: 'ASC', nulls: 'LAST' }, name: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(goal: Goal): Promise<void> {
    return this.rows.deleteOwned(goal.ownerId, goal.id);
  }
}
