import { IsoDate } from '../../common/domain';

export interface CompanyView {
  id: string;
  name: string;
  status: string;
}

export interface ProjectView {
  id: string;
  name: string;
  status: string;
  companyId: string | null;
  goalId: string | null;
  dueDate: IsoDate | null;
  nextDelivery: string | null;
}

/** Lightweight copy of a task, safe to hold outside the module. Status and priority in lower case. */
export interface TaskView {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectId: string | null;
  goalId: string | null;
  dueDate: IsoDate | null;
}

export abstract class WorkLookup {
  abstract companyExists(ownerId: string, companyId: string): Promise<boolean>;
  abstract projectExists(ownerId: string, projectId: string): Promise<boolean>;
  abstract taskExists(ownerId: string, taskId: string): Promise<boolean>;
  abstract companies(ownerId: string): Promise<CompanyView[]>;
  abstract projects(ownerId: string): Promise<ProjectView[]>;
  abstract tasks(ownerId: string): Promise<TaskView[]>;
}

/** Lets other modules create a task (e.g. a contact follow-up, CTC-03) through the work rules. */
export abstract class FollowUpTasks {
  /** Creates a "todo" task without project and returns its id. */
  abstract create(
    title: string,
    description: string | null,
    dueDate: IsoDate | null,
  ): Promise<string>;
}
