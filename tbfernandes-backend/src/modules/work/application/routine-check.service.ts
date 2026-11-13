import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { IsoDate, NotFoundError } from '../../../common/domain';
import {
  RoutineAlreadyCheckedError,
  RoutineCheck,
  RoutineCheckDetails,
  RoutineCheckRepository,
  RoutineRepository,
} from '../domain';

export interface RoutineCheckFilter {
  routineId?: string | null;
  from?: IsoDate | null;
  to?: IsoDate | null;
}

@Injectable()
export class RoutineCheckService {
  constructor(
    private readonly checks: RoutineCheckRepository,
    private readonly routines: RoutineRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  /** Marks the routine as done on that day (RN-32, RN-33). */
  create(details: RoutineCheckDetails): Promise<RoutineCheck> {
    return this.uow.run(async () => {
      const ownerId = this.owner.currentOwnerId();
      const routine = await this.routines.findById(ownerId, details.routineId);
      if (!routine) throw new NotFoundError('A rotina', details.routineId);
      if (await this.checks.exists(ownerId, routine.id, details.date))
        throw new RoutineAlreadyCheckedError();
      const check = RoutineCheck.create(
        this.ids.forNewAggregate(),
        ownerId,
        routine,
        details,
        this.clock.today(),
      );
      return this.checks.create(check);
    });
  }

  /** PUT changes only the note: the day and the routine identify the check. */
  update(id: string, note: string | null): Promise<RoutineCheck> {
    return this.uow.run(async () => {
      const check = await this.get(id);
      check.changeNote(note);
      return this.checks.save(check);
    });
  }

  /** Unmarks the day. */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.checks.delete(await this.get(id)));
  }

  async get(id: string): Promise<RoutineCheck> {
    const check = await this.checks.findById(this.owner.currentOwnerId(), id);
    if (!check) throw new NotFoundError('A marcação da rotina', id);
    return check;
  }

  list(filter: RoutineCheckFilter = {}): Promise<RoutineCheck[]> {
    return this.checks.findAll(this.owner.currentOwnerId(), filter);
  }
}
