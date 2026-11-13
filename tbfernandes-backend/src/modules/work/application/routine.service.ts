import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  ProjectRepository,
  Routine,
  RoutineDetails,
  RoutineRepository,
  TaskRepository,
} from '../domain';

@Injectable()
export class RoutineService {
  constructor(
    private readonly routines: RoutineRepository,
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: RoutineDetails): Promise<Routine> {
    return this.uow.run(async () => {
      const ownerId = this.owner.currentOwnerId();
      const routine = Routine.create(
        this.ids.forNewAggregate(),
        ownerId,
        await this.linked(ownerId, details),
      );
      return this.routines.create(routine);
    });
  }

  update(id: string, details: RoutineDetails): Promise<Routine> {
    return this.uow.run(async () => {
      const routine = await this.get(id);
      routine.update(await this.linked(routine.ownerId, details));
      return this.routines.save(routine);
    });
  }

  /** Its checks go with it; time entries stay, without the routine (RN-34). */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.routines.delete(await this.get(id)));
  }

  async get(id: string): Promise<Routine> {
    const routine = await this.routines.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!routine) throw new NotFoundError('A rotina', id);
    return routine;
  }

  list(): Promise<Routine[]> {
    return this.routines.findAll(this.owner.currentOwnerId());
  }

  /** RN-34: the linked task's project wins over the one sent. */
  private async linked(
    ownerId: string,
    details: RoutineDetails,
  ): Promise<RoutineDetails> {
    let projectId = details.projectId;
    if (details.taskId != null) {
      const task = await this.tasks.findById(ownerId, details.taskId);
      if (!task) throw new NotFoundError('A tarefa', details.taskId);
      projectId = task.details.projectId ?? projectId;
    }
    if (projectId != null && !(await this.projects.exists(ownerId, projectId)))
      throw new NotFoundError('O projeto', projectId);
    return { ...details, projectId };
  }
}
