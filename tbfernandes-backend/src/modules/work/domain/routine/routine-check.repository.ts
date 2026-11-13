import { IsoDate } from '../../../../common/domain';
import { RoutineCheck } from './routine-check';

export abstract class RoutineCheckRepository {
  abstract create(check: RoutineCheck): Promise<RoutineCheck>;
  abstract save(check: RoutineCheck): Promise<RoutineCheck>;
  abstract findById(ownerId: string, id: string): Promise<RoutineCheck | null>;
  abstract exists(
    ownerId: string,
    routineId: string,
    date: IsoDate,
  ): Promise<boolean>;
  /** Newest day first; from and to are inclusive. */
  abstract findAll(
    ownerId: string,
    filter?: {
      routineId?: string | null;
      from?: IsoDate | null;
      to?: IsoDate | null;
    },
  ): Promise<RoutineCheck[]>;
  abstract delete(check: RoutineCheck): Promise<void>;
}
