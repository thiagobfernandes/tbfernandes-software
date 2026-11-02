import { J, Joi } from '../../../common/protocols';
import {
  COMPANY_RELATIONSHIPS,
  COMPANY_STATUSES,
  CompanyRelationship,
  CompanyStatus,
} from '../domain';

/** Body of POST and PUT /companies. Enums in lower case, as the frontend sends them. */
export class CompanyRequest {
  name: string;
  tradeName?: string | null;
  /** contractor, client, partner or own */
  relationship: string;
  /** active, inactive or closed (default active) */
  status?: string | null;
  description?: string | null;
  /** YYYY-MM-DD */
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
  name: J.requiredText(120),
  tradeName: J.optionalText(120),
  relationship: J.enumOf(COMPANY_RELATIONSHIPS).required(),
  status: J.optionalEnumOf(COMPANY_STATUSES),
  description: J.optionalText(2000),
  startDate: J.isoDate().required(),
  mainContact: J.optionalText(120),
});
