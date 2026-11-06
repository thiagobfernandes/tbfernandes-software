import { RequestFields, Joi } from '../../../common/protocols';
import {
  PROJECT_CATEGORIES,
  PROJECT_COLORS,
  PROJECT_STATUSES,
  ProjectCategory,
  ProjectColor,
  ProjectStatus,
} from '../domain';

export class ProjectRequest {
  name: string;
  description?: string | null;
  companyId?: string | null;
  /** professional, personal, study or research */
  category: string;
  /** planned, active, paused or completed (default planned) */
  status?: string | null;
  /** teal, violet, amber, rose or sky (default teal) */
  color?: string | null;
  startDate: string;
  dueDate?: string | null;
  nextDelivery?: string | null;
  goalId?: string | null;
}

export interface ValidProjectRequest {
  name: string;
  description: string | null;
  companyId: string | null;
  category: ProjectCategory;
  status: ProjectStatus | null;
  color: ProjectColor | null;
  startDate: string;
  dueDate: string | null;
  nextDelivery: string | null;
  goalId: string | null;
}

export const projectRequestSchema = Joi.object<ValidProjectRequest>({
  name: RequestFields.requiredText(120),
  description: RequestFields.optionalText(2000),
  companyId: RequestFields.optionalUuid(),
  category: RequestFields.enumOf(PROJECT_CATEGORIES).required(),
  status: RequestFields.optionalEnumOf(PROJECT_STATUSES),
  color: RequestFields.optionalEnumOf(PROJECT_COLORS),
  startDate: RequestFields.isoDate().required(),
  dueDate: RequestFields.optionalIsoDate(),
  nextDelivery: RequestFields.optionalText(200),
  goalId: RequestFields.optionalUuid(),
});

export interface ProjectListQuery {
  companyId: string | null;
}

export const projectListQuerySchema = Joi.object<ProjectListQuery>({
  companyId: RequestFields.optionalUuid(),
  ...RequestFields.paging(),
});
