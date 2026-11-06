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
    const details = task.details;
    return {
      id: task.id,
      title: details.title,
      description: details.description,
      projectId: details.projectId,
      status: task.status.toLowerCase(),
      priority: (details.priority ?? 'NORMAL').toLowerCase(),
      tag: details.tag,
      startDate: details.startDate,
      dueDate: details.dueDate,
      doneCriteria: details.doneCriteria,
      checklist: task.progress(),
      checklistItems: details.checklistItems.map((item) => ({ ...item })),
      goalId: details.goalId,
      completedAt: toInstant(task.completedAt),
    };
  },
};
