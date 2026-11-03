import { J, Joi } from '../../../common/protocols';
import { STUDY_STATUSES, StudyStatus } from '../domain';

/** Body of POST and PUT /studies. */
export class StudyRequest {
  name: string;
  description?: string | null;
  /** planned (default), in_progress, paused or completed */
  status?: string | null;
  goalId?: string | null;
  skillIds?: string[] | null;
  startDate?: string | null;
  dueDate?: string | null;
  nextActivity?: string | null;
}

export interface ValidStudyRequest {
  name: string;
  description: string | null;
  status: StudyStatus | null;
  goalId: string | null;
  skillIds: string[] | null;
  startDate: string | null;
  dueDate: string | null;
  nextActivity: string | null;
}

export const studyRequestSchema = Joi.object<ValidStudyRequest>({
  name: J.requiredText(200),
  description: J.optionalText(2000),
  status: J.optionalEnumOf(STUDY_STATUSES),
  goalId: J.optionalUuid(),
  skillIds: J.uuidList().allow(null),
  startDate: J.optionalIsoDate(),
  dueDate: J.optionalIsoDate(),
  nextActivity: J.optionalText(300),
});

/** Same shape as the frontend's Study type. */
export class StudyResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
  goalId: string | null;
  skillIds: string[];
  startDate: string | null;
  dueDate: string | null;
  nextActivity: string | null;
}
