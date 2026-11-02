import {
  BusinessRuleViolationError,
  InvalidArgumentError,
} from '../../../../common/domain';
import { Contact, ContactDetails } from './contact';

const details: ContactDetails = {
  name: 'Ana',
  companyId: null,
  companyName: null,
  role: null,
  email: null,
  phone: null,
  profileUrl: null,
  specialties: [],
  context: null,
  nextContact: null,
  notes: null,
};

describe('Contact', () => {
  it('lowercases the e-mail and keeps unique, trimmed specialties', () => {
    const contact = Contact.create('c1', 'o1', {
      ...details,
      email: 'Ana@Acme.com',
      specialties: ['Java', ' Java', 'SQL', ''],
    });
    expect(contact.details.email).toBe('ana@acme.com');
    expect(contact.details.specialties).toEqual(['Java', 'SQL']);
  });

  it('rejects a company id together with a company name (RN-23)', () => {
    expect(() =>
      Contact.create('c1', 'o1', {
        ...details,
        companyId: 'co1',
        companyName: 'Acme Inc',
      }),
    ).toThrow(BusinessRuleViolationError);
  });

  it('rejects an invalid e-mail', () => {
    expect(() =>
      Contact.create('c1', 'o1', { ...details, email: 'ana@acme' }),
    ).toThrow(InvalidArgumentError);
  });

  it('keeps the contact when its company is deleted', () => {
    const contact = Contact.create('c1', 'o1', {
      ...details,
      companyId: 'co1',
    });
    contact.companyDeleted();
    expect(contact.details.companyId).toBeNull();
    expect(contact.details.name).toBe('Ana');
  });
});
