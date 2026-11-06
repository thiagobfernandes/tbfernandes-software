import { Contact, ContactDetails } from '../../domain';
import { ValidContactRequest } from '../contact.request';
import { ContactResponse } from '../contact.response';

export const ContactMapper = {
  toDetails(request: ValidContactRequest): ContactDetails {
    return {
      ...request,
      specialties: (request.specialties ?? []).filter(
        (value): value is string => value != null,
      ),
    };
  },

  toResponse(contact: Contact): ContactResponse {
    return { id: contact.id, ...contact.details };
  },
};
