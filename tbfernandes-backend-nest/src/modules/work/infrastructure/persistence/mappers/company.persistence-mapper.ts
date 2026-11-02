import { Company } from '../../../domain';
import { CompanyEntity } from '../company.entity';

/** Company ↔ work.company row. */
export const CompanyPersistenceMapper = {
  toDomain(e: CompanyEntity): Company {
    return Company.restore(e.id, e.ownerId, {
      name: e.name,
      tradeName: e.tradeName,
      relationship: e.relationship,
      status: e.status,
      description: e.description,
      startDate: e.startDate,
      mainContact: e.mainContact,
    });
  },

  toEntity(
    company: Company,
    e: CompanyEntity = new CompanyEntity(),
  ): CompanyEntity {
    const d = company.details;
    e.id = company.id;
    e.ownerId = company.ownerId;
    e.name = d.name;
    e.tradeName = d.tradeName;
    e.relationship = d.relationship;
    e.status = company.status;
    e.description = d.description;
    e.startDate = d.startDate;
    e.mainContact = d.mainContact;
    return e;
  },
};
