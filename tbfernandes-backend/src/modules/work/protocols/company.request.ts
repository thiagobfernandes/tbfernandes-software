import { RequestFields, Joi } from '../../../common/protocols';
import {
  COMPANY_RELATIONSHIPS,
  COMPANY_STATUSES,
  CompanyRelationship,
  CompanyStatus,
} from '../domain';

export class CompanyRequest {
  name: string;
  tradeName?: string | null;
  /** contractor, client, partner or own */
  relationship: string;
  /** active, inactive or closed (default active) */
  status?: string | null;
  description?: string | null;
  startDate: string;
  mainContact?: string | null;
}

/** The request after validation: enums already in upper case. */
export interface ValidCompanyRequest {
  name: string;
  tradeName: string | null;
  relationship: CompanyRelationship;
  status: CompanyStatus | null;
  description: string | null;
  startDate: string;
  mainContact: string | null;
}

export const companyRequestSchema = Joi.object<ValidCompanyRequest>({
  name: RequestFields.requiredText(120),
  tradeName: RequestFields.optionalText(120),
  relationship: RequestFields.enumOf(COMPANY_RELATIONSHIPS).required(),
  status: RequestFields.optionalEnumOf(COMPANY_STATUSES),
  description: RequestFields.optionalText(2000),
  startDate: RequestFields.isoDate().required(),
  mainContact: RequestFields.optionalText(120),
});
