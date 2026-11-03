import { Task } from '../../../domain';
import { TaskChecklistItemEntity, TaskEntity } from '../task.entity';

/** Task ↔ work.task row and its work.task_checklist_item rows. */
export const TaskPersistenceMapper = {
  toDomain(e: TaskEntity): Task {
    const items = [...(e.checklistItems ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ id: item.id, title: item.title, done: item.done }));
    return Task.restore(
      e.id,
      e.ownerId,
      {
        title: e.title,
        description: e.description,
        projectId: e.projectId,
        priority: e.priority,
        tag: e.tag,
        startDate: e.startDate,
        dueDate: e.dueDate,
        doneCriteria: e.doneCriteria,
        checklistDone: e.checklistDone,
        checklistTotal: e.checklistTotal,
        checklistItems: items,
        goalId: e.goalId,
      },
      e.status,
      e.completedAt,
    );
  },

  /** The task row only; items come from toItemEntities. */
  toEntity(task: Task, e: TaskEntity = new TaskEntity()): TaskEntity {
    const d = task.details;
    e.id = task.id;
    e.ownerId = task.ownerId;
    e.title = d.title;
    e.description = d.description;
    e.projectId = d.projectId;
    e.status = task.status;
    e.priority = d.priority ?? 'NORMAL';
    e.tag = d.tag;
    e.startDate = d.startDate;
    e.dueDate = d.dueDate;
    e.doneCriteria = d.doneCriteria;
    e.checklistDone = d.checklistDone;
    e.checklistTotal = d.checklistTotal;
    e.goalId = d.goalId;
    e.completedAt = task.completedAt;
    delete e.checklistItems;
    return e;
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
