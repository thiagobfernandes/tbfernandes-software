import { IsoDate } from '../../common/domain';

export interface ContactView {
  id: string;
  name: string;
  role: string | null;
  companyId: string | null;
  companyName: string | null;
  nextContact: IsoDate | null;
}

export abstract class ContactsLookup {
  abstract contacts(ownerId: string): Promise<ContactView[]>;
}
