import { J, Joi } from '../../../common/protocols';
import {
  PROJECT_CATEGORIES,
  PROJECT_COLORS,
  PROJECT_STATUSES,
  ProjectCategory,
  ProjectColor,
  ProjectStatus,
} from '../domain';

/** Body of POST and PUT /projects. */
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
  name: J.requiredText(120),
  description: J.optionalText(2000),
  companyId: J.optionalUuid(),
  category: J.enumOf(PROJECT_CATEGORIES).required(),
  status: J.optionalEnumOf(PROJECT_STATUSES),
  color: J.optionalEnumOf(PROJECT_COLORS),
  startDate: J.isoDate().required(),
  dueDate: J.optionalIsoDate(),
  nextDelivery: J.optionalText(200),
  goalId: J.optionalUuid(),
});

export interface ProjectListQuery {
  companyId: string | null;
}

export const projectListQuerySchema = Joi.object<ProjectListQuery>({
  companyId: J.optionalUuid(),
  ...J.paging(),
});
