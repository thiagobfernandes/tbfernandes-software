import { RequestFields, Joi } from '../../../common/protocols';
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
  title: RequestFields.requiredText(200),
  description: RequestFields.optionalText(5000),
  projectId: RequestFields.optionalUuid(),
  status: RequestFields.optionalEnumOf(TASK_STATUSES),
  priority: RequestFields.optionalEnumOf(TASK_PRIORITIES),
  tag: RequestFields.optionalText(40),
  startDate: RequestFields.optionalIsoDate(),
  dueDate: RequestFields.optionalIsoDate(),
  doneCriteria: RequestFields.optionalText(1000),
  checklist: Joi.object({
    done: Joi.number().integer().min(0).required(),
    total: Joi.number().integer().min(0).required(),
  })
    .allow(null)
    .default(null),
  checklistItems: Joi.array()
    .items(
      Joi.object({
        id: RequestFields.optionalUuid(),
        title: RequestFields.requiredText(200),
        done: Joi.boolean().allow(null).default(false),
      }),
    )
    .allow(null)
    .empty(null)
    .default([]),
  goalId: RequestFields.optionalUuid(),
});

export class StatusRequest {
  status: string;
}

export const statusRequestSchema = Joi.object<{ status: TaskStatus }>({
  status: RequestFields.enumOf(TASK_STATUSES).required(),
});

export interface TaskListQuery {
  projectId: string | null;
  status: TaskStatus | null;
  dueFrom: string | null;
  dueTo: string | null;
  overdue: boolean;
}

export const taskListQuerySchema = Joi.object<TaskListQuery>({
  projectId: RequestFields.optionalUuid(),
  status: RequestFields.optionalEnumOf(TASK_STATUSES),
  dueFrom: RequestFields.optionalIsoDate(),
  dueTo: RequestFields.optionalIsoDate(),
  overdue: Joi.boolean().default(false),
  ...RequestFields.paging(),
});
