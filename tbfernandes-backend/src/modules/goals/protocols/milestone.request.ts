import { RequestFields, Joi } from '../../../common/protocols';

export class MilestoneRequest {
  goalId: string;
  title: string;
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
  goalId: RequestFields.uuid().required(),
  title: RequestFields.requiredText(200),
  dueDate: RequestFields.optionalIsoDate(),
  done: Joi.boolean().allow(null).empty(null).default(false),
});

export interface MilestoneListQuery {
  goalId: string | null;
}

export const milestoneListQuerySchema = Joi.object<MilestoneListQuery>({
  goalId: RequestFields.optionalUuid(),
  ...RequestFields.paging(),
});

export class MilestoneResponse {
  id: string;
  goalId: string;
  title: string;
  dueDate: string | null;
  done: boolean;
}
