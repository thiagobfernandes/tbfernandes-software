import { J, Joi } from '../../../common/protocols';
import { GOAL_AREAS, GOAL_PRIORITIES, GOAL_STATUSES } from '../domain';
import type { GoalArea, GoalPriority, GoalStatus } from '../domain';

export class IndicatorBody {
  label: string;
  current?: number | null;
  target: number;
  unit: string;
}

/** Body of POST and PUT /goals. Enums in lower case. */
export class GoalRequest {
  name: string;
  description?: string | null;
  /** career | finance | learning | health | personal */
  area: string;
  /** planned | active | paused | completed */
  status?: string | null;
  /** low | normal | high */
  priority?: string | null;
  currentState?: string | null;
  desiredResult: string;
  doneCriteria?: string | null;
  /** YYYY-MM-DD */
  dueDate?: string | null;
  indicator?: IndicatorBody | null;
  parentId?: string | null;
}

export interface ValidIndicator {
  label: string;
  current: number | null;
  target: number | null;
  unit: string;
}

export interface ValidGoalRequest {
  name: string;
  description: string | null;
  area: GoalArea;
  status: GoalStatus | null;
  priority: GoalPriority | null;
  currentState: string | null;
  desiredResult: string;
  doneCriteria: string | null;
  dueDate: string | null;
  indicator: ValidIndicator | null;
  parentId: string | null;
}

export const goalRequestSchema = Joi.object<ValidGoalRequest>({
  name: J.requiredText(200),
  description: J.optionalText(2000),
  area: J.enumOf(GOAL_AREAS).required(),
  status: J.optionalEnumOf(GOAL_STATUSES),
  priority: J.optionalEnumOf(GOAL_PRIORITIES),
  currentState: J.optionalText(2000),
  desiredResult: J.requiredText(2000),
  doneCriteria: J.optionalText(1000),
  dueDate: J.optionalIsoDate(),
  indicator: Joi.object<ValidIndicator>({
    label: Joi.string().allow(null, '').default(null),
    current: Joi.number().allow(null).default(null),
    target: Joi.number().allow(null).default(null),
    unit: Joi.string().allow(null, '').default(null),
  })
    .allow(null)
    .default(null),
  parentId: J.optionalUuid(),
});

/** Body of PATCH /goals/{id}/indicator (RF-GOL-04). */
export class ProgressRequest {
  current: number;
}

export const progressRequestSchema = Joi.object<{ current: number }>({
  current: Joi.number().required(),
});

export class IndicatorResponse {
  label: string;
  current: number;
  target: number;
  unit: string;
}

/** Same shape as the frontend's Goal type. */
export class GoalResponse {
  id: string;
  name: string;
  description: string | null;
  area: string;
  status: string;
  priority: string;
  currentState: string | null;
  desiredResult: string;
  doneCriteria: string | null;
  dueDate: string | null;
  indicator: IndicatorResponse | null;
  parentId: string | null;
}

/** GOL-04: projects, tasks, studies and purchases that point to the goal. */
export class GoalLinksResponse {
  projects: object[];
  tasks: object[];
  studies: object[];
  purchases: object[];
}
