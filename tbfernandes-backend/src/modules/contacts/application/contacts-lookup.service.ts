import { Injectable } from '@nestjs/common';
import { ContactsLookup, ContactView } from '../contacts.lookup';
import { ContactRepository } from '../domain';

/** Implements the contacts module's public API on top of its own repository. */
@Injectable()
export class ContactsLookupService extends ContactsLookup {
  constructor(private readonly repository: ContactRepository) {
    super();
  }

  async contacts(ownerId: string): Promise<ContactView[]> {
    return (await this.repository.findAll(ownerId)).map((contact) => {
      const d = contact.details;
      return {
        id: contact.id,
        name: d.name,
        role: d.role,
        companyId: d.companyId,
        companyName: d.companyName,
        nextContact: d.nextContact,
      };
    });
  }
}
