import { J, Joi } from '../../../common/protocols';

/** Body of POST and PUT /milestones. */
export class MilestoneRequest {
  goalId: string;
  title: string;
  /** YYYY-MM-DD */
  dueDate?: string | null;
  done?: boolean | null;
}

export interface ValidMilestoneRequest {
  goalId: string;
  title: string;
  dueDate: string | null;
  done: boolean;
}

export const milestoneRequestSchema = Joi.object<ValidMilestoneRequest>({
  goalId: J.uuid().required(),
  title: J.requiredText(200),
  dueDate: J.optionalIsoDate(),
  done: Joi.boolean().allow(null).empty(null).default(false),
});

export interface MilestoneListQuery {
  goalId: string | null;
}

export const milestoneListQuerySchema = Joi.object<MilestoneListQuery>({
  goalId: J.optionalUuid(),
  ...J.paging(),
});

/** Same shape as the frontend's Milestone type. */
export class MilestoneResponse {
  id: string;
  goalId: string;
  title: string;
  dueDate: string | null;
  done: boolean;
}
