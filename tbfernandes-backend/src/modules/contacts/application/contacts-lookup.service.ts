import { Injectable } from '@nestjs/common';
import { ContactsLookup, ContactView } from '../contacts.lookup';
import { ContactRepository } from '../domain';

@Injectable()
export class ContactsLookupService extends ContactsLookup {
  constructor(private readonly repository: ContactRepository) {
    super();
  }

  async contacts(ownerId: string): Promise<ContactView[]> {
    return (await this.repository.findAll(ownerId)).map((contact) => {
      const details = contact.details;
      return {
        id: contact.id,
        name: details.name,
        role: details.role,
        companyId: details.companyId,
        companyName: details.companyName,
        nextContact: details.nextContact,
      };
    });
  }
}
