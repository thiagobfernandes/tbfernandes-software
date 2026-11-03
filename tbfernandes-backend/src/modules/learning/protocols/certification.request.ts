import { J, Joi } from '../../../common/protocols';
import { CERTIFICATION_STATUSES, CertificationStatus } from '../domain';

/** Body of POST and PUT /certifications. */
export class CertificationRequest {
  name: string;
  issuer: string;
  /** planned (default), studying, obtained or expired */
  status?: string | null;
  obtainedAt?: string | null;
  expiresAt?: string | null;
  validationUrl?: string | null;
  studyIds?: string[] | null;
}

export interface ValidCertificationRequest {
  name: string;
  issuer: string;
  status: CertificationStatus | null;
  obtainedAt: string | null;
  expiresAt: string | null;
  validationUrl: string | null;
  studyIds: string[] | null;
}

export const certificationRequestSchema = Joi.object<ValidCertificationRequest>(
  {
    name: J.requiredText(200),
    issuer: J.requiredText(120),
    status: J.optionalEnumOf(CERTIFICATION_STATUSES),
    obtainedAt: J.optionalIsoDate(),
    expiresAt: J.optionalIsoDate(),
    validationUrl: J.optionalText(2000),
    studyIds: J.uuidList().allow(null),
  },
);

export const certificationListQuerySchema = Joi.object<{
  expiringWithinDays: number | null;
}>({
  expiringWithinDays: Joi.number().integer().min(0).default(null),
  ...J.paging(),
});

/** Same shape as the frontend's Certification type. */
export class CertificationResponse {
  id: string;
  name: string;
  issuer: string;
  status: string;
  obtainedAt: string | null;
  expiresAt: string | null;
  validationUrl: string | null;
  studyIds: string[];
}
