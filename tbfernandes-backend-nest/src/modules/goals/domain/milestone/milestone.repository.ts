import { Milestone } from './milestone';

/** Implemented in infrastructure/persistence. */
export abstract class MilestoneRepository {
  abstract create(milestone: Milestone): Promise<Milestone>;
  abstract save(milestone: Milestone): Promise<Milestone>;
  abstract findById(ownerId: string, id: string): Promise<Milestone | null>;
  /** By due date (undated last); all of the owner's without a goal. */
  abstract findAll(
    ownerId: string,
    goalId: string | null,
  ): Promise<Milestone[]>;
  abstract delete(milestone: Milestone): Promise<void>;
}
