import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  ProjectRepository,
  RoutineRepository,
  TaskRepository,
  TimeEntry,
  TimeEntryDetails,
  TimeEntryRepository,
} from '../domain';

@Injectable()
export class TimeEntryService {
  constructor(
    private readonly entries: TimeEntryRepository,
    private readonly projects: ProjectRepository,
    private readonly tasks: TaskRepository,
    private readonly routines: RoutineRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: TimeEntryDetails): Promise<TimeEntry> {
    return this.uow.run(async () => {
      const ownerId = this.owner.currentOwnerId();
      const now = this.clock.now();
      const entry = TimeEntry.create(
        this.ids.forNewAggregate(),
        ownerId,
        await this.linked(ownerId, details),
        now,
      );
      await this.ensureCanCoexist(entry, now);
      return this.entries.create(entry);
    });
  }

  update(id: string, details: TimeEntryDetails): Promise<TimeEntry> {
    return this.uow.run(async () => {
      const entry = await this.get(id);
      const now = this.clock.now();
      entry.update(await this.linked(entry.ownerId, details), now);
      await this.ensureCanCoexist(entry, now);
      return this.entries.save(entry);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.entries.delete(await this.get(id)));
  }

  async get(id: string): Promise<TimeEntry> {
    const entry = await this.entries.findById(this.owner.currentOwnerId(), id);
    if (!entry) throw new NotFoundError('O apontamento', id);
    return entry;
  }

  list(): Promise<TimeEntry[]> {
    return this.entries.findAll(this.owner.currentOwnerId());
  }

  /**
   * RN-34: an entry for a routine takes the routine's task and project when it has none;
   * the task's project wins over the one sent.
   */
  private async linked(
    ownerId: string,
    details: TimeEntryDetails,
  ): Promise<TimeEntryDetails> {
    const withRoutine = await this.withRoutine(ownerId, details);
    let projectId = withRoutine.projectId;
    if (withRoutine.taskId != null) {
      const task = await this.tasks.findById(ownerId, withRoutine.taskId);
      if (!task) throw new NotFoundError('A tarefa', withRoutine.taskId);
      projectId = task.details.projectId ?? projectId;
    }
    if (
      projectId != null &&
      !(await this.projects.findById(ownerId, projectId))
    )
      throw new NotFoundError('O projeto', projectId);
    return { ...withRoutine, projectId };
  }

  private async withRoutine(
    ownerId: string,
    details: TimeEntryDetails,
  ): Promise<TimeEntryDetails> {
    if (details.routineId == null) return details;
    const routine = await this.routines.findById(ownerId, details.routineId);
    if (!routine) throw new NotFoundError('A rotina', details.routineId);
    const { taskId, projectId } = routine.details;
    return {
      ...details,
      taskId: details.taskId ?? taskId,
      projectId: details.projectId ?? projectId,
    };
  }

  private async ensureCanCoexist(entry: TimeEntry, now: Date): Promise<void> {
    const { startedAt, endedAt } = entry.details;
    const [touching, running] = await Promise.all([
      this.entries.findTouching(entry.ownerId, startedAt, endedAt ?? now),
      this.entries.findRunning(entry.ownerId),
    ]);
    entry.ensureCanCoexistWith(
      running ? [...touching, running] : touching,
      now,
    );
  }
}
