import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Milestone, MilestoneRepository } from '../../domain';
import { MilestoneEntity } from './milestone.entity';
import { MilestonePersistenceMapper as Mapper } from './mappers/milestone.persistence-mapper';

@Injectable()
export class TypeOrmMilestoneRepository extends MilestoneRepository {
  private readonly rows: BaseRepository<MilestoneEntity>;

  constructor(tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(MilestoneEntity, tx);
  }

  async create(milestone: Milestone): Promise<Milestone> {
    await this.rows.insertEntity(Mapper.toEntity(milestone));
    return milestone;
  }

  async save(milestone: Milestone): Promise<Milestone> {
    const existing = await this.rows.findOwned(milestone.ownerId, milestone.id);
    return Mapper.toDomain(
      await this.rows.saveEntity(
        Mapper.toEntity(milestone, existing ?? undefined),
      ),
    );
  }

  async findById(ownerId: string, id: string): Promise<Milestone | null> {
    const entity = await this.rows.findOwned(ownerId, id);
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string, goalId: string | null): Promise<Milestone[]> {
    const rows = await this.rows.findAllOwned(ownerId, {
      where: goalId == null ? {} : { goalId },
      order: { dueDate: { direction: 'ASC', nulls: 'LAST' }, createdAt: 'ASC' },
    });
    return rows.map((row) => Mapper.toDomain(row));
  }

  delete(milestone: Milestone): Promise<void> {
    return this.rows.deleteOwned(milestone.ownerId, milestone.id);
  }
}
