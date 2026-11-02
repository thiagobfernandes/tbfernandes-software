import { Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { BaseRepository } from '../../../../infrastructure/database/base.repository';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { Task, TaskFilter, TaskRepository } from '../../domain';
import { TaskPersistenceMapper as Mapper } from './mappers/task.persistence-mapper';
import { TaskChecklistItemEntity, TaskEntity } from './task.entity';

/** TaskRepository on TypeORM. Checklist items are rewritten in order on every save. */
@Injectable()
export class TypeOrmTaskRepository extends TaskRepository {
  private readonly rows: BaseRepository<TaskEntity>;

  constructor(private readonly tx: TransactionalManager) {
    super();
    this.rows = new BaseRepository(TaskEntity, tx);
  }

  private get items() {
    return this.tx.manager.getRepository(TaskChecklistItemEntity);
  }

  async create(task: Task): Promise<Task> {
    await this.rows.insertEntity(Mapper.toEntity(task));
    await this.writeItems(task);
    return (await this.findById(task.ownerId, task.id))!;
  }

  async save(task: Task): Promise<Task> {
    const existing = await this.rows.findOwned(task.ownerId, task.id);
    await this.rows.saveEntity(Mapper.toEntity(task, existing ?? undefined));
    await this.items.delete({ taskId: task.id });
    await this.writeItems(task);
    return (await this.findById(task.ownerId, task.id))!;
  }

  async findById(ownerId: string, id: string): Promise<Task | null> {
    const entity = await this.rows.findOwned(ownerId, id, {
      checklistItems: true,
    });
    return entity && Mapper.toDomain(entity);
  }

  async findAll(ownerId: string, filter: TaskFilter = {}): Promise<Task[]> {
    const query = this.rows.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.checklistItems', 'item')
      .where('task.owner_id = :ownerId', { ownerId });
    if (filter.projectId)
      query.andWhere('task.project_id = :projectId', {
        projectId: filter.projectId,
      });
    if (filter.status)
      query.andWhere('task.status = :status', { status: filter.status });
    if (filter.dueFrom)
      query.andWhere('task.due_date >= :dueFrom', { dueFrom: filter.dueFrom });
    if (filter.dueTo)
      query.andWhere('task.due_date <= :dueTo', { dueTo: filter.dueTo });
    if (filter.overdueOn) {
      query.andWhere(
        new Brackets((overdue) =>
          overdue
            .where('task.due_date < :overdueOn', {
              overdueOn: filter.overdueOn,
            })
            .andWhere("task.status NOT IN ('DONE', 'CANCELED')"),
        ),
      );
    }
    const rows = await query
      .orderBy('task.due_date', 'ASC', 'NULLS LAST')
      .addOrderBy('task.created_at', 'ASC')
      .addOrderBy('item.position', 'ASC')
      .getMany();
    return rows.map((item) => Mapper.toDomain(item));
  }

  delete(task: Task): Promise<void> {
    return this.rows.deleteOwned(task.ownerId, task.id);
  }

  async unlinkProject(ownerId: string, projectId: string): Promise<void> {
    await this.rows.repository.update(
      { ownerId, projectId },
      { projectId: null },
    );
  }

  async countCompletedSince(ownerId: string, since: Date): Promise<number> {
    return this.rows.repository
      .createQueryBuilder('task')
      .where('task.owner_id = :ownerId', { ownerId })
      .andWhere('task.completed_at >= :since', { since })
      .getCount();
  }

  private async writeItems(task: Task): Promise<void> {
    const items = Mapper.toItemEntities(task);
    if (items.length) await this.items.insert(items);
  }
}
