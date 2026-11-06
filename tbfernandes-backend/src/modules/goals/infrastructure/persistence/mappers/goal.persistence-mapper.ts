import { Goal } from '../../../domain';
import { GoalEntity } from '../goal.entity';

/** Goal ↔ goals.goal row. The indicator is four columns, all set or none. */
export const GoalPersistenceMapper = {
  toDomain(entity: GoalEntity): Goal {
    return Goal.restore(entity.id, entity.ownerId, {
      name: entity.name,
      description: entity.description,
      area: entity.area,
      status: entity.status,
      priority: entity.priority,
      currentState: entity.currentState,
      desiredResult: entity.desiredResult,
      doneCriteria: entity.doneCriteria,
      dueDate: entity.dueDate,
      indicator:
        entity.indicatorLabel == null
          ? null
          : {
              label: entity.indicatorLabel,
              current: entity.indicatorCurrent ?? 0,
              target: entity.indicatorTarget!,
              unit: entity.indicatorUnit ?? '',
            },
      parentId: entity.parentId,
    });
  },

  toEntity(goal: Goal, entity: GoalEntity = new GoalEntity()): GoalEntity {
    const details = goal.details;
    const indicator = details.indicator;
    entity.id = goal.id;
    entity.ownerId = goal.ownerId;
    entity.parentId = details.parentId;
    entity.name = details.name;
    entity.description = details.description;
    entity.area = details.area;
    entity.status = goal.status;
    entity.priority = goal.priority;
    entity.currentState = details.currentState;
    entity.desiredResult = details.desiredResult;
    entity.doneCriteria = details.doneCriteria;
    entity.dueDate = details.dueDate;
    entity.indicatorLabel = indicator?.label ?? null;
    entity.indicatorCurrent = indicator?.current ?? null;
    entity.indicatorTarget = indicator?.target ?? null;
    entity.indicatorUnit = indicator?.unit ?? null;
    return entity;
  },
};
