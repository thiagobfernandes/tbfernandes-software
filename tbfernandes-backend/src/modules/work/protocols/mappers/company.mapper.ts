import { Company, CompanyDetails } from '../../domain';
import { CompanyResponse } from '../company.response';
import { ValidCompanyRequest } from '../company.request';

export const CompanyMapper = {
  toDetails(request: ValidCompanyRequest): CompanyDetails {
    return { ...request };
  },

  toResponse(company: Company): CompanyResponse {
    const details = company.details;
    return {
      id: company.id,
      name: details.name,
      tradeName: details.tradeName,
      relationship: details.relationship.toLowerCase(),
      status: company.status.toLowerCase(),
      description: details.description,
      startDate: details.startDate,
      mainContact: details.mainContact,
    };
  },
};
