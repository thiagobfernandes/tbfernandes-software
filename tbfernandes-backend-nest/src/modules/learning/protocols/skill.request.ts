import { J, Joi } from '../../../common/protocols';

/** Body of POST and PUT /skills. */
export class SkillRequest {
  name: string;
  /** 1 to 5 (RN-13) */
  level: number;
  evidence?: string | null;
}

export interface ValidSkillRequest {
  name: string;
  level: number;
  evidence: string | null;
}

/** The level range is a business rule (RN-13, 422), so the schema only checks the type. */
export const skillRequestSchema = Joi.object<ValidSkillRequest>({
  name: J.requiredText(120),
  level: Joi.number().allow(null).default(0),
  evidence: J.optionalText(2000),
});

/** Same shape as the frontend's Skill type. */
export class SkillResponse {
  id: string;
  name: string;
  level: number;
  evidence: string | null;
}
