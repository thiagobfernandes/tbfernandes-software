import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
} from '../../../../common/domain';

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const EVERY_DAY: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * The editable fields of a routine. taskId points to the task the routine moves forward
 * (the task is not completed by the routine); projectId follows the task when there is one.
 */
export interface RoutineDetails {
  title: string;
  description: string | null;
  projectId: string | null;
  taskId: string | null;
  weekdays: Weekday[];
  startTime: string | null;
  targetMinutes: number | null;
  startDate: IsoDate;
  active: boolean;
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const MAX_TARGET_MINUTES = 24 * 60;

export function weekdayOf(day: IsoDate): Weekday {
  const sundayFirst = new Date(`${day}T00:00:00Z`).getUTCDay();
  return (sundayFirst === 0 ? 7 : sundayFirst) as Weekday;
}

/**
 * Something done again and again on chosen weekdays (every day by default). Each day it is
 * done becomes a RoutineCheck; time spent on it is a TimeEntry pointing to it.
 */
export class Routine {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: RoutineDetails,
  ) {}

  static create(id: string, ownerId: string, details: RoutineDetails): Routine {
    return new Routine(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Routine.validated(details),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: RoutineDetails,
  ): Routine {
    return new Routine(id, ownerId, details);
  }

  get details(): RoutineDetails {
    return { ...this._details, weekdays: [...this._details.weekdays] };
  }

  update(details: RoutineDetails): void {
    this._details = Routine.validated(details);
  }

  /** RN-32: active, already started and scheduled for that weekday. */
  isDueOn(day: IsoDate): boolean {
    const { active, startDate, weekdays } = this._details;
    return active && day >= startDate && weekdays.includes(weekdayOf(day));
  }

  /** RN-31: at least one weekday, each 1..7; target from 1 minute to 24 hours. */
  private static validated(details: RoutineDetails): RoutineDetails {
    return {
      title: Require.text(details.title, 'title', 200),
      description: Require.optionalText(
        details.description,
        'description',
        2000,
      ),
      projectId: details.projectId ?? null,
      taskId: details.taskId ?? null,
      weekdays: Routine.validWeekdays(details.weekdays),
      startTime: Routine.validStartTime(details.startTime),
      targetMinutes: Routine.validTarget(details.targetMinutes),
      startDate: Require.present(details.startDate, 'startDate'),
      active: details.active ?? true,
    };
  }

  private static validWeekdays(weekdays: Weekday[] | null): Weekday[] {
    const unique = [...new Set(weekdays ?? EVERY_DAY)].sort(
      (first, second) => first - second,
    );
    const outOfRange = unique.some(
      (day) => !Number.isInteger(day) || day < 1 || day > 7,
    );
    if (unique.length === 0 || outOfRange) {
      throw new BusinessRuleViolationError(
        'RN-31',
        'Escolha pelo menos um dia da semana para a rotina',
      );
    }
    return unique;
  }

  private static validStartTime(startTime: string | null): string | null {
    if (startTime == null || startTime === '') return null;
    if (!TIME_OF_DAY.test(startTime)) {
      throw new BusinessRuleViolationError(
        'RN-31',
        'O horário da rotina precisa estar no formato HH:mm',
      );
    }
    return startTime.length === 5 ? `${startTime}:00` : startTime;
  }

  private static validTarget(target: number | null): number | null {
    if (target == null) return null;
    if (
      !Number.isInteger(target) ||
      target < 1 ||
      target > MAX_TARGET_MINUTES
    ) {
      throw new BusinessRuleViolationError(
        'RN-31',
        'A meta de tempo da rotina vai de 1 minuto a 24 horas',
      );
    }
    return target;
  }
}
