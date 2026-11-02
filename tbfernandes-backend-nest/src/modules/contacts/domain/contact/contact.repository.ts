import { Contact } from './contact';

/** Implemented in infrastructure/persistence. */
export abstract class ContactRepository {
  abstract create(contact: Contact): Promise<Contact>;
  abstract save(contact: Contact): Promise<Contact>;
  abstract findById(ownerId: string, id: string): Promise<Contact | null>;
  /** Ordered by name. */
  abstract findAll(ownerId: string): Promise<Contact[]>;
  abstract findByCompany(
    ownerId: string,
    companyId: string,
  ): Promise<Contact[]>;
  /** Interactions go with the contact (RN-10, ON DELETE CASCADE). */
  abstract delete(contact: Contact): Promise<void>;
}
