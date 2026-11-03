import {
  Decimals,
  Goal,
  GoalDetails,
  Milestone,
  MilestoneDetails,
} from '../../domain';
import type { GoalResponse, ValidGoalRequest } from '../goal.request';
import type {
  MilestoneResponse,
  ValidMilestoneRequest,
} from '../milestone.request';

/** JSON ↔ Goal. Indicator values in JSON numbers, hundredths in the domain. */
export const GoalMapper = {
  toDetails(r: ValidGoalRequest): GoalDetails {
    const i = r.indicator;
    return {
      ...r,
      indicator: i && {
        label: i.label,
        unit: i.unit,
        current: i.current == null ? null : Decimals.hundredths(i.current),
        target: i.target == null ? null : Decimals.hundredths(i.target),
      },
    };
  },

  toResponse(goal: Goal): GoalResponse {
    const d = goal.details;
    const i = d.indicator;
    return {
      id: goal.id,
      name: d.name,
      description: d.description,
      area: d.area.toLowerCase(),
      status: goal.status.toLowerCase(),
      priority: goal.priority.toLowerCase(),
      currentState: d.currentState,
      desiredResult: d.desiredResult,
      doneCriteria: d.doneCriteria,
      dueDate: d.dueDate,
      indicator: i && {
        label: i.label,
        current: Decimals.toNumber(i.current),
        target: Decimals.toNumber(i.target),
        unit: i.unit,
      },
      parentId: d.parentId,
    };
  },
};

/** JSON ↔ Milestone. */
export const MilestoneMapper = {
  toDetails(r: ValidMilestoneRequest): MilestoneDetails {
    return { ...r };
  },

  toResponse(milestone: Milestone): MilestoneResponse {
    return { id: milestone.id, ...milestone.details };
  },
};
