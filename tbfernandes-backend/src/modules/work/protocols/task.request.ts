import { J, Joi } from '../../../common/protocols';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskPriority,
  TaskStatus,
} from '../domain';

export class ProgressDto {
  done: number;
  total: number;
}

export class ChecklistItemDto {
  /** Kept when sent; the API creates one for new items. */
  id?: string | null;
  title: string;
  done?: boolean;
}

/** Body of POST and PUT /tasks. */
export class TaskRequest {
  title: string;
  description?: string | null;
  projectId?: string | null;
  /** backlog, todo, in_progress, blocked, done or canceled */
  status?: string | null;
  /** low, normal, high or urgent */
  priority?: string | null;
  tag?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  doneCriteria?: string | null;
  checklist?: ProgressDto | null;
  checklistItems?: ChecklistItemDto[] | null;
  goalId?: string | null;
}

export interface ValidTaskRequest {
  title: string;
  description: string | null;
  projectId: string | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  tag: string | null;
  startDate: string | null;
  dueDate: string | null;
  doneCriteria: string | null;
  checklist: { done: number; total: number } | null;
  checklistItems: Array<{ id: string | null; title: string; done: boolean }>;
  goalId: string | null;
}

export const taskRequestSchema = Joi.object<ValidTaskRequest>({
  title: J.requiredText(200),
  description: J.optionalText(5000),
  projectId: J.optionalUuid(),
  status: J.optionalEnumOf(TASK_STATUSES),
  priority: J.optionalEnumOf(TASK_PRIORITIES),
  tag: J.optionalText(40),
  startDate: J.optionalIsoDate(),
  dueDate: J.optionalIsoDate(),
  doneCriteria: J.optionalText(1000),
  checklist: Joi.object({
    done: Joi.number().integer().min(0).required(),
    total: Joi.number().integer().min(0).required(),
  })
    .allow(null)
    .default(null),
  checklistItems: Joi.array()
    .items(
      Joi.object({
        id: J.optionalUuid(),
        title: J.requiredText(200),
        done: Joi.boolean().allow(null).default(false),
      }),
    )
    .allow(null)
    .empty(null)
    .default([]),
  goalId: J.optionalUuid(),
});

export class StatusRequest {
  status: string;
}

export const statusRequestSchema = Joi.object<{ status: TaskStatus }>({
  status: J.enumOf(TASK_STATUSES).required(),
});

export interface TaskListQuery {
  projectId: string | null;
  status: TaskStatus | null;
  dueFrom: string | null;
  dueTo: string | null;
  overdue: boolean;
}

export const taskListQuerySchema = Joi.object<TaskListQuery>({
  projectId: J.optionalUuid(),
  status: J.optionalEnumOf(TASK_STATUSES),
  dueFrom: J.optionalIsoDate(),
  dueTo: J.optionalIsoDate(),
  overdue: Joi.boolean().default(false),
  ...J.paging(),
});
