import { RequestFields, Joi } from '../../../common/protocols';
import { STUDY_STATUSES, StudyStatus } from '../domain';

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
  name: RequestFields.requiredText(200),
  description: RequestFields.optionalText(2000),
  status: RequestFields.optionalEnumOf(STUDY_STATUSES),
  goalId: RequestFields.optionalUuid(),
  skillIds: RequestFields.uuidList().allow(null),
  startDate: RequestFields.optionalIsoDate(),
  dueDate: RequestFields.optionalIsoDate(),
  nextActivity: RequestFields.optionalText(300),
});

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
