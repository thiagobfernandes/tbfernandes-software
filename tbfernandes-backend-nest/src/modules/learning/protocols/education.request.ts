import { J, Joi } from '../../../common/protocols';
import { EDUCATION_STATUSES, EducationStatus } from '../domain';

/** Body of POST and PUT /educations. */
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
  institution: J.requiredText(200),
  course: J.requiredText(200),
  degree: J.requiredText(80),
  status: J.enumOf(EDUCATION_STATUSES).required(),
  startDate: J.isoDate().required(),
  endDate: J.optionalIsoDate(),
});

/** Same shape as the frontend's Education type. */
export class EducationResponse {
  id: string;
  institution: string;
  course: string;
  degree: string;
  status: string;
  startDate: string;
  endDate: string | null;
}
