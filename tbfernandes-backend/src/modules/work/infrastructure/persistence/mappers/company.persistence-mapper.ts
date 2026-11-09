import { Company } from '../../../domain';
import { CompanyEntity } from '../company.entity';

export const CompanyPersistenceMapper = {
  toDomain(entity: CompanyEntity): Company {
    return Company.restore(entity.id, entity.ownerId, {
      name: entity.name,
      tradeName: entity.tradeName,
      relationship: entity.relationship,
      status: entity.status,
      description: entity.description,
      startDate: entity.startDate,
      mainContact: entity.mainContact,
    });
  },

  toEntity(
    company: Company,
    entity: CompanyEntity = new CompanyEntity(),
  ): CompanyEntity {
    const details = company.details;
    entity.id = company.id;
    entity.ownerId = company.ownerId;
    entity.name = details.name;
    entity.tradeName = details.tradeName;
    entity.relationship = details.relationship;
    entity.status = company.status;
    entity.description = details.description;
    entity.startDate = details.startDate;
    entity.mainContact = details.mainContact;
    return entity;
  },
};
