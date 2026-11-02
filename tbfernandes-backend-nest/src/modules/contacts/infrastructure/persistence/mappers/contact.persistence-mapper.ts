import { Contact } from '../../../domain';
import { ContactEntity } from '../contact.entity';

/** Contact ↔ contacts.contact row. */
export const ContactPersistenceMapper = {
  toDomain(e: ContactEntity): Contact {
    return Contact.restore(e.id, e.ownerId, {
      name: e.name,
      companyId: e.companyId,
      companyName: e.companyName,
      role: e.role,
      email: e.email,
      phone: e.phone,
      profileUrl: e.profileUrl,
      specialties: e.specialties ?? [],
      context: e.context,
      nextContact: e.nextContact,
      notes: e.notes,
    });
  },

  toEntity(
    contact: Contact,
    e: ContactEntity = new ContactEntity(),
  ): ContactEntity {
    e.id = contact.id;
    e.ownerId = contact.ownerId;
    Object.assign(e, contact.details);
    return e;
  },
};
