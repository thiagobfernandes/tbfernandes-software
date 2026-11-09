import { Joi, RequestFields } from '../../../common/protocols';

export class TimeEntryRequest {
  description: string;
  projectId?: string | null;
  taskId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  note?: string | null;
}

export interface ValidTimeEntryRequest {
  description: string;
  projectId: string | null;
  taskId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  note: string | null;
}

export const timeEntryRequestSchema = Joi.object<ValidTimeEntryRequest>({
  description: RequestFields.requiredText(200),
  projectId: RequestFields.optionalUuid(),
  taskId: RequestFields.optionalUuid(),
  startedAt: Joi.date().iso().required(),
  endedAt: Joi.date().iso().allow(null, '').empty('').default(null),
  note: RequestFields.optionalText(2000),
});
