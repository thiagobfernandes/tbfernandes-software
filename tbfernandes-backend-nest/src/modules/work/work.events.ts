import { DomainEvent } from '../../common/domain';

/** Public events of the work module. Other modules listen with @OnEvent(<type>). */
export const WorkEvents = {
  taskCompleted: 'work.task-completed',
  taskDeleted: 'work.task-deleted',
  projectDeleted: 'work.project-deleted',
  companyDeleted: 'work.company-deleted',
} as const;

/** A task moved to done (RN-06). Goals and the dashboard listen to it. */
export interface TaskCompleted extends DomainEvent {
  type: typeof WorkEvents.taskCompleted;
  taskId: string;
  projectId: string | null;
  goalId: string | null;
  completedAt: string;
}

/** A task was deleted. Other modules drop their links to it. */
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
