import { Company, CompanyDetails } from '../../domain';
import { CompanyResponse } from '../company.response';
import { ValidCompanyRequest } from '../company.request';

/** JSON ↔ Company. */
export const CompanyMapper = {
  toDetails(request: ValidCompanyRequest): CompanyDetails {
    return { ...request };
  },

  toResponse(company: Company): CompanyResponse {
    const d = company.details;
    return {
      id: company.id,
      name: d.name,
      tradeName: d.tradeName,
      relationship: d.relationship.toLowerCase(),
      status: company.status.toLowerCase(),
      description: d.description,
      startDate: d.startDate,
      mainContact: d.mainContact,
    };
  },
};
