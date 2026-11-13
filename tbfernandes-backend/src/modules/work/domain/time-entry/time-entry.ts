import { Require } from '../../../../common/domain';
import {
  TimeEntryAlreadyRunningError,
  TimeEntryInvalidPeriodError,
  TimeEntryOverlapError,
} from '../errors';

export interface TimeEntryDetails {
  description: string;
  projectId: string | null;
  taskId: string | null;
  routineId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  note: string | null;
}

const CLOCK_SKEW_MS = 60_000;

export class TimeEntry {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: TimeEntryDetails,
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: TimeEntryDetails,
    now: Date,
  ): TimeEntry {
    return new TimeEntry(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      TimeEntry.validated(details, now),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: TimeEntryDetails,
  ): TimeEntry {
    return new TimeEntry(id, ownerId, details);
  }

  get details(): TimeEntryDetails {
    return { ...this._details };
  }

  get isRunning(): boolean {
    return this._details.endedAt === null;
  }

  update(details: TimeEntryDetails, now: Date): void {
    this._details = TimeEntry.validated(details, now);
  }

  stop(now: Date): void {
    if (!this.isRunning) return;
    this.update({ ...this._details, endedAt: now }, now);
  }

  durationSeconds(now: Date): number {
    const end = this._details.endedAt ?? now;
    return Math.max(
      0,
      Math.floor((end.getTime() - this._details.startedAt.getTime()) / 1000),
    );
  }

  overlaps(other: TimeEntry, now: Date): boolean {
    if (other.id === this.id) return false;
    const mine = this.period(now);
    const theirs = other.period(now);
    return mine.start < theirs.end && theirs.start < mine.end;
  }

  ensureCanCoexistWith(others: TimeEntry[], now: Date): void {
    const rest = others.filter((other) => other.id !== this.id);
    if (this.isRunning && rest.some((other) => other.isRunning))
      throw new TimeEntryAlreadyRunningError();
    if (rest.some((other) => this.overlaps(other, now)))
      throw new TimeEntryOverlapError();
  }

  private period(now: Date): { start: number; end: number } {
    return {
      start: this._details.startedAt.getTime(),
      end: (this._details.endedAt ?? now).getTime(),
    };
  }

  private static validated(details: TimeEntryDetails, now: Date) {
    const startedAt = Require.present(details.startedAt, 'startedAt');
    const endedAt = details.endedAt ?? null;
    const latest = now.getTime() + CLOCK_SKEW_MS;
    if (startedAt.getTime() > latest || (endedAt && endedAt.getTime() > latest))
      throw TimeEntryInvalidPeriodError.inTheFuture();
    if (endedAt && endedAt.getTime() <= startedAt.getTime())
      throw TimeEntryInvalidPeriodError.endBeforeStart();
    return {
      description: Require.text(details.description, 'description', 200),
      projectId: details.projectId ?? null,
      taskId: details.taskId ?? null,
      routineId: details.routineId ?? null,
      startedAt,
      endedAt,
      note: Require.optionalText(details.note, 'note', 2000),
    };
  }
}
