import { RequestFields, Joi } from '../../../common/protocols';
import { GOAL_AREAS, GOAL_PRIORITIES, GOAL_STATUSES } from '../domain';
import type { GoalArea, GoalPriority, GoalStatus } from '../domain';

export class IndicatorBody {
  label: string;
  current?: number | null;
  target: number;
  unit: string;
}

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
  name: RequestFields.requiredText(200),
  description: RequestFields.optionalText(2000),
  area: RequestFields.enumOf(GOAL_AREAS).required(),
  status: RequestFields.optionalEnumOf(GOAL_STATUSES),
  priority: RequestFields.optionalEnumOf(GOAL_PRIORITIES),
  currentState: RequestFields.optionalText(2000),
  desiredResult: RequestFields.requiredText(2000),
  doneCriteria: RequestFields.optionalText(1000),
  dueDate: RequestFields.optionalIsoDate(),
  indicator: Joi.object<ValidIndicator>({
    label: Joi.string().allow(null, '').default(null),
    current: Joi.number().allow(null).default(null),
    target: Joi.number().allow(null).default(null),
    unit: Joi.string().allow(null, '').default(null),
  })
    .allow(null)
    .default(null),
  parentId: RequestFields.optionalUuid(),
});

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

export class GoalLinksResponse {
  projects: object[];
  tasks: object[];
  studies: object[];
  purchases: object[];
}
