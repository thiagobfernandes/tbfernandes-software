import { Contact, ContactDetails } from '../../domain';
import { ValidContactRequest } from '../contact.request';
import { ContactResponse } from '../contact.response';

/** JSON ↔ Contact. */
export const ContactMapper = {
  toDetails(request: ValidContactRequest): ContactDetails {
    return {
      ...request,
      specialties: (request.specialties ?? []).filter(
        (s): s is string => s != null,
      ),
    };
  },

  toResponse(contact: Contact): ContactResponse {
    return { id: contact.id, ...contact.details };
  },
};
