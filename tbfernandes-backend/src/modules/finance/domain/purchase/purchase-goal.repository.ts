import { PurchaseGoal } from './purchase-goal';

/** Implemented in infrastructure/persistence. */
export abstract class PurchaseGoalRepository {
  abstract create(purchase: PurchaseGoal): Promise<PurchaseGoal>;
  abstract save(purchase: PurchaseGoal): Promise<PurchaseGoal>;
  abstract findById(ownerId: string, id: string): Promise<PurchaseGoal | null>;
  /** By desired date (undated last), then name. */
  abstract findAll(ownerId: string): Promise<PurchaseGoal[]>;
  abstract delete(purchase: PurchaseGoal): Promise<void>;
}
