import { IsoDate } from '../../../../common/domain';
import { Task, TaskStatus } from './task';

/**
 * All filters are optional. overdueOn returns open tasks due before that day; dueFrom and
 * dueTo are inclusive.
 */
export interface TaskFilter {
  projectId?: string | null;
  status?: TaskStatus | null;
  dueFrom?: IsoDate | null;
  dueTo?: IsoDate | null;
  overdueOn?: IsoDate | null;
}

/** Implemented in infrastructure/persistence. */
export abstract class TaskRepository {
  abstract create(task: Task): Promise<Task>;
  abstract save(task: Task): Promise<Task>;
  abstract findById(ownerId: string, id: string): Promise<Task | null>;
  /** Soonest due first (no due date last), then oldest. */
  abstract findAll(ownerId: string, filter?: TaskFilter): Promise<Task[]>;
  abstract delete(task: Task): Promise<void>;
  /** Detaches the tasks of a deleted project (they stay, without project). */
  abstract unlinkProject(ownerId: string, projectId: string): Promise<void>;
  abstract countCompletedSince(ownerId: string, since: Date): Promise<number>;
}
