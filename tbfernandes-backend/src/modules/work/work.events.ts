import { DomainEvent } from '../../common/domain';

export const WorkEvents = {
  taskCompleted: 'work.task-completed',
  taskDeleted: 'work.task-deleted',
  projectDeleted: 'work.project-deleted',
  companyDeleted: 'work.company-deleted',
} as const;

export interface TaskCompleted extends DomainEvent {
  type: typeof WorkEvents.taskCompleted;
  taskId: string;
  projectId: string | null;
  goalId: string | null;
  completedAt: string;
}

export interface TaskDeleted extends DomainEvent {
  type: typeof WorkEvents.taskDeleted;
  taskId: string;
}

/** A project was deleted; its tasks were unlinked, not deleted. */
export interface ProjectDeleted extends DomainEvent {
  type: typeof WorkEvents.projectDeleted;
  projectId: string;
}

/** A company was deleted (only possible without projects, RN-01). */
export interface CompanyDeleted extends DomainEvent {
  type: typeof WorkEvents.companyDeleted;
  companyId: string;
}
