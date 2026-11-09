import { PurchaseGoal } from '../../../domain';
import { PurchaseGoalEntity } from '../purchase-goal.entity';

export const PurchaseGoalPersistenceMapper = {
  toDomain(entity: PurchaseGoalEntity): PurchaseGoal {
    return PurchaseGoal.restore(entity.id, entity.ownerId, {
      name: entity.name,
      description: entity.description,
      estimated: entity.estimated,
      reserved: entity.reserved,
      monthlySaving: entity.monthlySaving,
      priority: entity.priority,
      desiredDate: entity.desiredDate,
      goalId: entity.goalId,
      status: entity.status,
      paid: entity.paid,
    });
  },

  toEntity(
    purchase: PurchaseGoal,
    entity: PurchaseGoalEntity = new PurchaseGoalEntity(),
  ): PurchaseGoalEntity {
    const details = purchase.details;
    entity.id = purchase.id;
    entity.ownerId = purchase.ownerId;
    entity.name = details.name;
    entity.description = details.description;
    entity.estimated = details.estimated;
    entity.reserved = purchase.reserved;
    entity.monthlySaving = details.monthlySaving;
    entity.priority = purchase.priority;
    entity.desiredDate = details.desiredDate;
    entity.goalId = details.goalId;
    entity.status = purchase.status;
    entity.paid = details.paid;
    return entity;
  },
};
