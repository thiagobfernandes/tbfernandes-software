import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
} from '../../../../common/domain';

export const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'CANCELED',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

/**
 * The editable fields of a task. checklistDone/checklistTotal are the aggregate progress of
 * tasks without itemized checklists; goalId points to the goals module (no FK).
 */
export interface TaskDetails {
  title: string;
  description: string | null;
  projectId: string | null;
  priority: TaskPriority | null;
  tag: string | null;
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
  doneCriteria: string | null;
  checklistDone: number | null;
  checklistTotal: number | null;
  checklistItems: ChecklistItem[];
  goalId: string | null;
}

export interface Progress {
  done: number;
  total: number;
}

export function isOpen(status: TaskStatus): boolean {
  return status !== 'DONE' && status !== 'CANCELED';
}

/**
 * A unit of work. Holds the status rules: completing records when (RN-06), reopening clears
 * it, and a blocked task cannot be completed directly (RN-07).
 */
export class Task {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: TaskDetails,
    private _status: TaskStatus,
    private _completedAt: Date | null,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: TaskDetails,
    status: TaskStatus | null,
    now: Date,
  ): Task {
    const task = new Task(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Task.validated(details),
      'BACKLOG',
      null,
    );
    task.changeStatus(status ?? 'BACKLOG', now);
    return task;
  }

  static restore(
    id: string,
    ownerId: string,
    details: TaskDetails,
    status: TaskStatus,
    completedAt: Date | null,
  ): Task {
    return new Task(id, ownerId, details, status, completedAt);
  }

  get details(): TaskDetails {
    return {
      ...this._details,
      checklistItems: [...this._details.checklistItems],
    };
  }

  get status(): TaskStatus {
    return this._status;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  update(details: TaskDetails): void {
    this._details = Task.validated(details);
  }

  /** Moves the task and returns true when this call completed it (to publish TaskCompleted). */
  changeStatus(next: TaskStatus, now: Date): boolean {
    Require.present(next, 'status');
    if (next === this._status) return false;
    if (this._status === 'BLOCKED' && next === 'DONE') {
      throw new BusinessRuleViolationError(
        'RN-07',
        'Desbloqueie a tarefa antes de concluí-la',
      );
    }
    this._status = next;
    if (next === 'DONE') {
      this._completedAt = now;
      return true;
    }
    this._completedAt = null;
    return false;
  }

  /** Progress from itemized items when present, else the aggregate (same as the frontend). */
  progress(): Progress | null {
    const items = this._details.checklistItems;
    if (items.length > 0)
      return {
        done: items.filter((item) => item.done).length,
        total: items.length,
      };
    const { checklistDone, checklistTotal } = this._details;
    return checklistTotal == null || checklistDone == null
      ? null
      : { done: checklistDone, total: checklistTotal };
  }

  isOpen(): boolean {
    return isOpen(this._status);
  }

  /** RN-08: done and total come together, with 0 <= done <= total. */
  private static validatedChecklistProgress(details: TaskDetails) {
    const done = details.checklistDone ?? null;
    const total = details.checklistTotal ?? null;
    const onlyOneSet = (done === null) !== (total === null);
    const outOfRange =
      done !== null && total !== null && (done < 0 || total < done);
    if (onlyOneSet || outOfRange) {
      throw new BusinessRuleViolationError(
        'RN-08',
        'O progresso da checklist precisa de 0 <= feitos <= total',
      );
    }
    return { done, total };
  }

  private static validated(details: TaskDetails): TaskDetails {
    Require.dateOrder(details.startDate, details.dueDate, 'dueDate');
    const { done, total } = Task.validatedChecklistProgress(details);
    return {
      title: Require.text(details.title, 'title', 200),
      description: Require.optionalText(
        details.description,
        'description',
        5000,
      ),
      projectId: details.projectId ?? null,
      priority: details.priority ?? 'NORMAL',
      tag: Require.optionalText(details.tag, 'tag', 40),
      startDate: details.startDate ?? null,
      dueDate: details.dueDate ?? null,
      doneCriteria: Require.optionalText(
        details.doneCriteria,
        'doneCriteria',
        1000,
      ),
      checklistDone: done,
      checklistTotal: total,
      checklistItems: (details.checklistItems ?? []).map((item) => ({
        id: Require.present(item.id, 'checklist item id'),
        title: Require.text(item.title, 'checklist item title', 200),
        done: !!item.done,
      })),
      goalId: details.goalId ?? null,
    };
  }
}
