import { Routine } from './routine';

export abstract class RoutineRepository {
  abstract create(routine: Routine): Promise<Routine>;
  abstract save(routine: Routine): Promise<Routine>;
  abstract findById(ownerId: string, id: string): Promise<Routine | null>;
  /** Active first, then by start time (no time last) and title. */
  abstract findAll(ownerId: string): Promise<Routine[]>;
  abstract delete(routine: Routine): Promise<void>;
}
