import { Skill } from './skill';

/** Implemented in infrastructure/persistence. */
export abstract class SkillRepository {
  abstract create(skill: Skill): Promise<Skill>;
  abstract save(skill: Skill): Promise<Skill>;
  abstract findById(ownerId: string, id: string): Promise<Skill | null>;
  /** Ordered by name. */
  abstract findAll(ownerId: string): Promise<Skill[]>;
  /** True when every id is one of the owner's skills. */
  abstract allExist(ownerId: string, ids: readonly string[]): Promise<boolean>;
  abstract delete(skill: Skill): Promise<void>;
}
