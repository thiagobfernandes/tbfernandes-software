import { J, Joi } from '../../../common/protocols';
import {
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  MaterialStatus,
  MaterialType,
} from '../domain';

/** Body of POST and PUT /materials. */
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
  studyId: J.optionalUuid(),
  title: J.requiredText(300),
  type: J.enumOf(MATERIAL_TYPES).required(),
  url: J.optionalText(2000),
  status: J.optionalEnumOf(MATERIAL_STATUSES),
  notes: J.optionalText(5000),
});

export const materialListQuerySchema = Joi.object<{ studyId: string | null }>({
  studyId: J.optionalUuid(),
  ...J.paging(),
});

/** Same shape as the frontend's Material type. */
export class MaterialResponse {
  id: string;
  studyId: string | null;
  title: string;
  type: string;
  url: string | null;
  status: string;
  notes: string | null;
}
