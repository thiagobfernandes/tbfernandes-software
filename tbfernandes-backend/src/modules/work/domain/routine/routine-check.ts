import { IsoDate, Require } from '../../../../common/domain';
import { RoutineNotDueError } from '../errors';
import { Routine } from './routine';

export interface RoutineCheckDetails {
  routineId: string;
  date: IsoDate;
  note: string | null;
}

/** A routine done on one day. Removing the check means it was not done that day. */
export class RoutineCheck {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: RoutineCheckDetails,
  ) {}

  /** RN-32: only on a day the routine is due, and never in the future. */
  static create(
    id: string,
    ownerId: string,
    routine: Routine,
    details: RoutineCheckDetails,
    today: IsoDate,
  ): RoutineCheck {
    const date = Require.present(details.date, 'date');
    if (date > today) throw RoutineNotDueError.inTheFuture();
    if (!routine.isDueOn(date)) throw RoutineNotDueError.notScheduled();
    return new RoutineCheck(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      {
        routineId: routine.id,
        date,
        note: Require.optionalText(details.note, 'note', 2000),
      },
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: RoutineCheckDetails,
  ): RoutineCheck {
    return new RoutineCheck(id, ownerId, details);
  }

  get details(): RoutineCheckDetails {
    return { ...this._details };
  }

  /** Only the note changes; another day or routine is another check. */
  changeNote(note: string | null): void {
    this._details = {
      ...this._details,
      note: Require.optionalText(note, 'note', 2000),
    };
  }
}
