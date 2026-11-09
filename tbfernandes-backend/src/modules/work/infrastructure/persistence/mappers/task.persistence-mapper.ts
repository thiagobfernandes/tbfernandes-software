import { Task } from '../../../domain';
import { TaskChecklistItemEntity, TaskEntity } from '../task.entity';

export const TaskPersistenceMapper = {
  toDomain(entity: TaskEntity): Task {
    const items = [...(entity.checklistItems ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((item) => ({ id: item.id, title: item.title, done: item.done }));
    return Task.restore(
      entity.id,
      entity.ownerId,
      {
        title: entity.title,
        description: entity.description,
        projectId: entity.projectId,
        priority: entity.priority,
        tag: entity.tag,
        startDate: entity.startDate,
        dueDate: entity.dueDate,
        doneCriteria: entity.doneCriteria,
        checklistDone: entity.checklistDone,
        checklistTotal: entity.checklistTotal,
        checklistItems: items,
        goalId: entity.goalId,
      },
      entity.status,
      entity.completedAt,
    );
  },

  /** The task row only; items come from toItemEntities. */
  toEntity(task: Task, entity: TaskEntity = new TaskEntity()): TaskEntity {
    const details = task.details;
    entity.id = task.id;
    entity.ownerId = task.ownerId;
    entity.title = details.title;
    entity.description = details.description;
    entity.projectId = details.projectId;
    entity.status = task.status;
    entity.priority = details.priority ?? 'NORMAL';
    entity.tag = details.tag;
    entity.startDate = details.startDate;
    entity.dueDate = details.dueDate;
    entity.doneCriteria = details.doneCriteria;
    entity.checklistDone = details.checklistDone;
    entity.checklistTotal = details.checklistTotal;
    entity.goalId = details.goalId;
    entity.completedAt = task.completedAt;
    delete entity.checklistItems;
    return entity;
  },

  toItemEntities(task: Task): TaskChecklistItemEntity[] {
    return task.details.checklistItems.map((item, position) =>
      Object.assign(new TaskChecklistItemEntity(), {
        taskId: task.id,
        position,
        ...item,
      }),
    );
  },
};
