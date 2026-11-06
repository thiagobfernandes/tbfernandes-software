import { RequestFields, Joi } from '../../../common/protocols';
import {
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  MaterialStatus,
  MaterialType,
} from '../domain';

export class MaterialRequest {
  studyId?: string | null;
  title: string;
  /** video, article, book, docs, course, repository, paper or note */
  type: string;
  url?: string | null;
  /** to_consume (default), in_progress, consumed or reviewed */
  status?: string | null;
  notes?: string | null;
}

export interface ValidMaterialRequest {
  studyId: string | null;
  title: string;
  type: MaterialType;
  url: string | null;
  status: MaterialStatus | null;
  notes: string | null;
}

export const materialRequestSchema = Joi.object<ValidMaterialRequest>({
  studyId: RequestFields.optionalUuid(),
  title: RequestFields.requiredText(300),
  type: RequestFields.enumOf(MATERIAL_TYPES).required(),
  url: RequestFields.optionalText(2000),
  status: RequestFields.optionalEnumOf(MATERIAL_STATUSES),
  notes: RequestFields.optionalText(5000),
});

export const materialListQuerySchema = Joi.object<{ studyId: string | null }>({
  studyId: RequestFields.optionalUuid(),
  ...RequestFields.paging(),
});

export class MaterialResponse {
  id: string;
  studyId: string | null;
  title: string;
  type: string;
  url: string | null;
  status: string;
  notes: string | null;
}
