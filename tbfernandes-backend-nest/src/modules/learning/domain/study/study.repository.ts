import { Study } from './study';

/** Implemented in infrastructure/persistence. */
export abstract class StudyRepository {
  abstract create(study: Study): Promise<Study>;
  abstract save(study: Study): Promise<Study>;
  abstract findById(ownerId: string, id: string): Promise<Study | null>;
  /** Ordered by name. */
  abstract findAll(ownerId: string): Promise<Study[]>;
  /** True when every id is one of the owner's studies. */
  abstract allExist(ownerId: string, ids: readonly string[]): Promise<boolean>;
  /** Materials stay, without study (ON DELETE SET NULL). */
  abstract delete(study: Study): Promise<void>;
}
