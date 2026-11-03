import { Goal } from '../../../domain';
import { GoalEntity } from '../goal.entity';

/** Goal ↔ goals.goal row. The indicator is four columns, all set or none. */
export const GoalPersistenceMapper = {
  toDomain(e: GoalEntity): Goal {
    return Goal.restore(e.id, e.ownerId, {
      name: e.name,
      description: e.description,
      area: e.area,
      status: e.status,
      priority: e.priority,
      currentState: e.currentState,
      desiredResult: e.desiredResult,
      doneCriteria: e.doneCriteria,
      dueDate: e.dueDate,
      indicator:
        e.indicatorLabel == null
          ? null
          : {
              label: e.indicatorLabel,
              current: e.indicatorCurrent ?? 0,
              target: e.indicatorTarget!,
              unit: e.indicatorUnit ?? '',
            },
      parentId: e.parentId,
    });
  },

  toEntity(goal: Goal, e: GoalEntity = new GoalEntity()): GoalEntity {
    const d = goal.details;
    const i = d.indicator;
    e.id = goal.id;
    e.ownerId = goal.ownerId;
    e.parentId = d.parentId;
    e.name = d.name;
    e.description = d.description;
    e.area = d.area;
    e.status = goal.status;
    e.priority = goal.priority;
    e.currentState = d.currentState;
    e.desiredResult = d.desiredResult;
    e.doneCriteria = d.doneCriteria;
    e.dueDate = d.dueDate;
    e.indicatorLabel = i?.label ?? null;
    e.indicatorCurrent = i?.current ?? null;
    e.indicatorTarget = i?.target ?? null;
    e.indicatorUnit = i?.unit ?? null;
    return e;
  },
};
