import { Milestone } from '../../../domain';
import { MilestoneEntity } from '../milestone.entity';

export const MilestonePersistenceMapper = {
  toDomain(entity: MilestoneEntity): Milestone {
    return Milestone.restore(entity.id, entity.ownerId, {
      goalId: entity.goalId,
      title: entity.title,
      dueDate: entity.dueDate,
      done: entity.done,
    });
  },

  toEntity(
    milestone: Milestone,
    entity: MilestoneEntity = new MilestoneEntity(),
  ): MilestoneEntity {
    entity.id = milestone.id;
    entity.ownerId = milestone.ownerId;
    Object.assign(entity, milestone.details);
    return entity;
  },
};
