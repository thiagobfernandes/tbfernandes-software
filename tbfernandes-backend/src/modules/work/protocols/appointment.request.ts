import { Joi, RequestFields } from '../../../common/protocols';

export class AppointmentRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId?: string | null;
  note?: string | null;
}

export interface ValidAppointmentRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId: string | null;
  note: string | null;
}

const timeOfDay = () =>
  Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'HH:mm:ss')
    .required();

export const appointmentRequestSchema = Joi.object<ValidAppointmentRequest>({
  title: RequestFields.requiredText(200),
  date: RequestFields.isoDate().required(),
  startTime: timeOfDay(),
  endTime: timeOfDay(),
  taskId: RequestFields.optionalUuid(),
  note: RequestFields.optionalText(2000),
});
