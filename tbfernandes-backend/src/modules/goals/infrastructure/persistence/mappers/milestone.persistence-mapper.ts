import { Milestone } from '../../../domain';
import { MilestoneEntity } from '../milestone.entity';

/** Milestone ↔ goals.milestone row. */
export const MilestonePersistenceMapper = {
  toDomain(e: MilestoneEntity): Milestone {
    return Milestone.restore(e.id, e.ownerId, {
      goalId: e.goalId,
      title: e.title,
      dueDate: e.dueDate,
      done: e.done,
    });
  },

  toEntity(
    milestone: Milestone,
    e: MilestoneEntity = new MilestoneEntity(),
  ): MilestoneEntity {
    e.id = milestone.id;
    e.ownerId = milestone.ownerId;
    Object.assign(e, milestone.details);
    return e;
  },
};
