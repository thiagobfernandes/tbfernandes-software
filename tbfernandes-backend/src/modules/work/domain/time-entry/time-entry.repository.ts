import { TimeEntry } from './time-entry';

export abstract class TimeEntryRepository {
  abstract create(entry: TimeEntry): Promise<TimeEntry>;
  abstract save(entry: TimeEntry): Promise<TimeEntry>;
  abstract findById(ownerId: string, id: string): Promise<TimeEntry | null>;
  abstract findAll(ownerId: string): Promise<TimeEntry[]>;
  abstract findRunning(ownerId: string): Promise<TimeEntry | null>;
  abstract findTouching(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<TimeEntry[]>;
  abstract delete(entry: TimeEntry): Promise<void>;
}
