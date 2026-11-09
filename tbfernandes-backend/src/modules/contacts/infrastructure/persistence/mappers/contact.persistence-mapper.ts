import { Contact } from '../../../domain';
import { ContactEntity } from '../contact.entity';

export const ContactPersistenceMapper = {
  toDomain(entity: ContactEntity): Contact {
    return Contact.restore(entity.id, entity.ownerId, {
      name: entity.name,
      companyId: entity.companyId,
      companyName: entity.companyName,
      role: entity.role,
      email: entity.email,
      phone: entity.phone,
      profileUrl: entity.profileUrl,
      specialties: entity.specialties ?? [],
      context: entity.context,
      nextContact: entity.nextContact,
      notes: entity.notes,
    });
  },

  toEntity(
    contact: Contact,
    entity: ContactEntity = new ContactEntity(),
  ): ContactEntity {
    entity.id = contact.id;
    entity.ownerId = contact.ownerId;
    Object.assign(entity, contact.details);
    return entity;
  },
};
