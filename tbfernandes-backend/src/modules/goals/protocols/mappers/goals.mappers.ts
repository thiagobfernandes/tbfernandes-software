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
  toDetails(request: ValidGoalRequest): GoalDetails {
    const indicator = request.indicator;
    return {
      ...request,
      indicator: indicator && {
        label: indicator.label,
        unit: indicator.unit,
        current:
          indicator.current == null
            ? null
            : Decimals.hundredths(indicator.current),
        target:
          indicator.target == null
            ? null
            : Decimals.hundredths(indicator.target),
      },
    };
  },

  toResponse(goal: Goal): GoalResponse {
    const details = goal.details;
    const indicator = details.indicator;
    return {
      id: goal.id,
      name: details.name,
      description: details.description,
      area: details.area.toLowerCase(),
      status: goal.status.toLowerCase(),
      priority: goal.priority.toLowerCase(),
      currentState: details.currentState,
      desiredResult: details.desiredResult,
      doneCriteria: details.doneCriteria,
      dueDate: details.dueDate,
      indicator: indicator && {
        label: indicator.label,
        current: Decimals.toNumber(indicator.current),
        target: Decimals.toNumber(indicator.target),
        unit: indicator.unit,
      },
      parentId: details.parentId,
    };
  },
};

export const MilestoneMapper = {
  toDetails(request: ValidMilestoneRequest): MilestoneDetails {
    return { ...request };
  },

  toResponse(milestone: Milestone): MilestoneResponse {
    return { id: milestone.id, ...milestone.details };
  },
};
