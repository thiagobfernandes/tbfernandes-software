import { RequestFields, Joi } from '../../../common/protocols';
import { CERTIFICATION_STATUSES, CertificationStatus } from '../domain';

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
    name: RequestFields.requiredText(200),
    issuer: RequestFields.requiredText(120),
    status: RequestFields.optionalEnumOf(CERTIFICATION_STATUSES),
    obtainedAt: RequestFields.optionalIsoDate(),
    expiresAt: RequestFields.optionalIsoDate(),
    validationUrl: RequestFields.optionalText(2000),
    studyIds: RequestFields.uuidList().allow(null),
  },
);

export const certificationListQuerySchema = Joi.object<{
  expiringWithinDays: number | null;
}>({
  expiringWithinDays: Joi.number().integer().min(0).default(null),
  ...RequestFields.paging(),
});

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
