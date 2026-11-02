import { toInstant } from '../../../../common/protocols';
import { Task, TaskDetails } from '../../domain';
import { ValidTaskRequest } from '../task.request';
import { TaskResponse } from '../task.response';

/** JSON ↔ Task. New checklist items get an id from `newId`. */
export const TaskMapper = {
  toDetails(request: ValidTaskRequest, newId: () => string): TaskDetails {
    return {
      title: request.title,
      description: request.description,
      projectId: request.projectId,
      priority: request.priority,
      tag: request.tag,
      startDate: request.startDate,
      dueDate: request.dueDate,
      doneCriteria: request.doneCriteria,
      checklistDone: request.checklist?.done ?? null,
      checklistTotal: request.checklist?.total ?? null,
      checklistItems: request.checklistItems.map((item) => ({
        id: item.id ?? newId(),
        title: item.title,
        done: item.done,
      })),
      goalId: request.goalId,
    };
  },

  toResponse(task: Task): TaskResponse {
    const d = task.details;
    return {
      id: task.id,
      title: d.title,
      description: d.description,
      projectId: d.projectId,
      status: task.status.toLowerCase(),
      priority: (d.priority ?? 'NORMAL').toLowerCase(),
      tag: d.tag,
      startDate: d.startDate,
      dueDate: d.dueDate,
      doneCriteria: d.doneCriteria,
      checklist: task.progress(),
      checklistItems: d.checklistItems.map((item) => ({ ...item })),
      goalId: d.goalId,
      completedAt: toInstant(task.completedAt),
    };
  },
};
