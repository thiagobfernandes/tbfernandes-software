import { IsoDate } from '../../common/domain';

/** Lightweight copy of a contact, safe to hold outside the module. */
export interface ContactView {
  id: string;
  name: string;
  role: string | null;
  companyId: string | null;
  companyName: string | null;
  nextContact: IsoDate | null;
}

/** Read access to contacts for other modules (the assistant). */
export abstract class ContactsLookup {
  abstract contacts(ownerId: string): Promise<ContactView[]>;
}
