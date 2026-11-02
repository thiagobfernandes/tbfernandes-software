import { PurchaseGoal } from '../../../domain';
import { PurchaseGoalEntity } from '../purchase-goal.entity';

/** PurchaseGoal ↔ finance.purchase_goal row. */
export const PurchaseGoalPersistenceMapper = {
  toDomain(e: PurchaseGoalEntity): PurchaseGoal {
    return PurchaseGoal.restore(e.id, e.ownerId, {
      name: e.name,
      description: e.description,
      estimated: e.estimated,
      reserved: e.reserved,
      monthlySaving: e.monthlySaving,
      priority: e.priority,
      desiredDate: e.desiredDate,
      goalId: e.goalId,
      status: e.status,
      paid: e.paid,
    });
  },

  toEntity(
    purchase: PurchaseGoal,
    e: PurchaseGoalEntity = new PurchaseGoalEntity(),
  ): PurchaseGoalEntity {
    const d = purchase.details;
    e.id = purchase.id;
    e.ownerId = purchase.ownerId;
    e.name = d.name;
    e.description = d.description;
    e.estimated = d.estimated;
    e.reserved = purchase.reserved;
    e.monthlySaving = d.monthlySaving;
    e.priority = purchase.priority;
    e.desiredDate = d.desiredDate;
    e.goalId = d.goalId;
    e.status = purchase.status;
    e.paid = d.paid;
    return e;
  },
};
