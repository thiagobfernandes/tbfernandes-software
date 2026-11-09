import { RequestFields, Joi } from '../../../common/protocols';
import { EDUCATION_STATUSES, EducationStatus } from '../domain';

export class EducationRequest {
  institution: string;
  course: string;
  degree: string;
  /** in_progress, completed or paused */
  status: string;
  startDate: string;
  endDate?: string | null;
}

export interface ValidEducationRequest {
  institution: string;
  course: string;
  degree: string;
  status: EducationStatus;
  startDate: string;
  endDate: string | null;
}

export const educationRequestSchema = Joi.object<ValidEducationRequest>({
  institution: RequestFields.requiredText(200),
  course: RequestFields.requiredText(200),
  degree: RequestFields.requiredText(80),
  status: RequestFields.enumOf(EDUCATION_STATUSES).required(),
  startDate: RequestFields.isoDate().required(),
  endDate: RequestFields.optionalIsoDate(),
});

export class EducationResponse {
  id: string;
  institution: string;
  course: string;
  degree: string;
  status: string;
  startDate: string;
  endDate: string | null;
}
