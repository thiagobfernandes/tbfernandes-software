import { Joi, RequestFields } from '../../../common/protocols';
import { Weekday } from '../domain';

export class RoutineRequest {
  title: string;
  description?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  goalId?: string | null;
  /** ISO weekdays, 1 = Monday ... 7 = Sunday; absent means every day. */
  weekdays?: number[] | null;
  startTime?: string | null;
  targetMinutes?: number | null;
  startDate: string;
  active?: boolean | null;
}

export interface ValidRoutineRequest {
  title: string;
  description: string | null;
  projectId: string | null;
  taskId: string | null;
  goalId: string | null;
  weekdays: Weekday[];
  startTime: string | null;
  targetMinutes: number | null;
  startDate: string;
  active: boolean;
}

export const routineRequestSchema = Joi.object<ValidRoutineRequest>({
  title: RequestFields.requiredText(200),
  description: RequestFields.optionalText(2000),
  projectId: RequestFields.optionalUuid(),
  taskId: RequestFields.optionalUuid(),
  goalId: RequestFields.optionalUuid(),
  weekdays: Joi.array()
    .items(Joi.number().integer().min(1).max(7))
    .min(1)
    .allow(null)
    .empty(null)
    .default([1, 2, 3, 4, 5, 6, 7]),
  startTime: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'HH:mm')
    .allow(null, '')
    .empty('')
    .default(null),
  targetMinutes: Joi.number()
    .integer()
    .min(1)
    .max(1440)
    .allow(null)
    .default(null),
  startDate: RequestFields.isoDate().required(),
  active: Joi.boolean().allow(null).empty(null).default(true),
});

export class RoutineCheckRequest {
  routineId: string;
  date: string;
  note?: string | null;
}

export interface ValidRoutineCheckRequest {
  routineId: string;
  date: string;
  note: string | null;
}

export const routineCheckRequestSchema = Joi.object<ValidRoutineCheckRequest>({
  routineId: RequestFields.uuid().required(),
  date: RequestFields.isoDate().required(),
  note: RequestFields.optionalText(2000),
});

export interface RoutineCheckListQuery {
  routineId: string | null;
  from: string | null;
  to: string | null;
}

export const routineCheckListQuerySchema = Joi.object<RoutineCheckListQuery>({
  routineId: RequestFields.optionalUuid(),
  from: RequestFields.optionalIsoDate(),
  to: RequestFields.optionalIsoDate(),
});
