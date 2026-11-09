import {
  BusinessRuleViolationError,
  InvalidArgumentError,
  IsoDate,
  Require,
} from '../../../../common/domain';

export type TimeOfDay = string;

export interface AppointmentDetails {
  title: string;
  date: IsoDate;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  taskId: string | null;
  note: string | null;
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class Appointment {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: AppointmentDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: AppointmentDetails,
  ): Appointment {
    return new Appointment(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Appointment.validated(details),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: AppointmentDetails,
  ): Appointment {
    return new Appointment(id, ownerId, details);
  }

  get details(): AppointmentDetails {
    return { ...this._details };
  }

  update(details: AppointmentDetails): void {
    this._details = Appointment.validated(details);
  }

  overlaps(other: Appointment): boolean {
    const mine = this._details;
    const theirs = other.details;
    return (
      other.id !== this.id &&
      mine.date === theirs.date &&
      mine.startTime < theirs.endTime &&
      theirs.startTime < mine.endTime
    );
  }

  ensureNoOverlap(sameDay: Appointment[]): void {
    if (sameDay.some((other) => this.overlaps(other))) {
      throw new BusinessRuleViolationError(
        'RN-27',
        'Já existe um agendamento nesse horário',
      );
    }
  }

  private static validated(details: AppointmentDetails): AppointmentDetails {
    const startTime = Appointment.time(details.startTime, 'startTime');
    const endTime = Appointment.time(details.endTime, 'endTime');
    if (endTime <= startTime) {
      throw new BusinessRuleViolationError(
        'RN-26',
        'O fim do agendamento precisa ser depois do início',
      );
    }
    return {
      title: Require.text(details.title, 'title', 200),
      date: Require.present(details.date, 'date'),
      startTime,
      endTime,
      taskId: details.taskId ?? null,
      note: Require.optionalText(details.note, 'note', 2000),
    };
  }

  private static time(value: string, field: string): TimeOfDay {
    const present = Require.present(value, field);
    if (!TIME_OF_DAY.test(present)) {
      throw new InvalidArgumentError(`${field} deve estar no formato HH:mm:ss`);
    }
    return present.length === 5 ? `${present}:00` : present;
  }
}
