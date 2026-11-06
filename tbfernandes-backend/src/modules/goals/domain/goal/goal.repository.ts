import { Goal } from './goal';

export abstract class GoalRepository {
  abstract create(goal: Goal): Promise<Goal>;
  abstract save(goal: Goal): Promise<Goal>;
  abstract findById(ownerId: string, id: string): Promise<Goal | null>;
  /** By due date (undated last), then name. */
  abstract findAll(ownerId: string): Promise<Goal[]>;
  /** Sub-goals and milestones go with it (RN-09, ON DELETE CASCADE). */
  abstract delete(goal: Goal): Promise<void>;
}
