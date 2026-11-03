import { Injectable } from '@nestjs/common';
import {
  Clock,
  EventPublisher,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  ProjectRepository,
  Task,
  TaskDetails,
  TaskFilter,
  TaskRepository,
  TaskStatus,
} from '../domain';
import { TaskCompleted, TaskDeleted, WorkEvents } from '../work.events';

/** Task use cases (RF-WRK-07..11). TaskCompleted leaves after the commit. */
@Injectable()
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: TaskDetails, status: TaskStatus | null): Promise<Task> {
    return this.uow.run(async () => {
      await this.checkProject(details.projectId);
      const task = Task.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
        status,
        this.clock.now(),
      );
      const saved = await this.tasks.create(task);
      if (saved.status === 'DONE') this.publishCompleted(saved);
      return saved;
    });
  }

  /** PUT: the fields, and the status when the body has one (the frontend sends whole records). */
  update(
    id: string,
    details: TaskDetails,
    status?: TaskStatus | null,
  ): Promise<Task> {
    return this.uow.run(async () => {
      const task = await this.get(id);
      await this.checkProject(details.projectId);
      task.update(details);
      const completed = status
        ? task.changeStatus(status, this.clock.now())
        : false;
      const saved = await this.tasks.save(task);
      if (completed) this.publishCompleted(saved);
      return saved;
    });
  }

  /** Used by the board drag and drop and the status menu. */
  changeStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.uow.run(async () => {
      const task = await this.get(id);
      const completed = task.changeStatus(status, this.clock.now());
      const saved = await this.tasks.save(task);
      if (completed) this.publishCompleted(saved);
      return saved;
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const task = await this.get(id);
      await this.tasks.delete(task);
      this.events.publish({
        type: WorkEvents.taskDeleted,
        ownerId: task.ownerId,
        taskId: id,
      } satisfies TaskDeleted);
    });
  }

  async get(id: string): Promise<Task> {
    const task = await this.tasks.findById(this.owner.currentOwnerId(), id);
    if (!task) throw new NotFoundError('A tarefa', id);
    return task;
  }

  /** WRK-06: `overdue` returns open tasks due before today. */
  list(
    filter: Omit<TaskFilter, 'overdueOn'> & { overdue?: boolean },
  ): Promise<Task[]> {
    const { overdue, ...rest } = filter;
    return this.tasks.findAll(this.owner.currentOwnerId(), {
      ...rest,
      overdueOn: overdue ? this.clock.today() : null,
    });
  }

  private async checkProject(projectId: string | null): Promise<void> {
    if (
      projectId &&
      !(await this.projects.exists(this.owner.currentOwnerId(), projectId))
    ) {
      throw new NotFoundError('O projeto', projectId);
    }
  }

  private publishCompleted(task: Task): void {
    const details = task.details;
    this.events.publish({
      type: WorkEvents.taskCompleted,
      ownerId: task.ownerId,
      taskId: task.id,
      projectId: details.projectId,
      goalId: details.goalId,
      completedAt: task.completedAt!.toISOString(),
    } satisfies TaskCompleted);
  }
}
