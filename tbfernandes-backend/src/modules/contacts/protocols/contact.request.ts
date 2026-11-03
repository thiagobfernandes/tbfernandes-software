import { J, Joi } from '../../../common/protocols';

/** Body of POST and PUT /contacts. A registered company or a company name, not both (RN-23). */
export class ContactRequest {
  name: string;
  companyId?: string | null;
  companyName?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  profileUrl?: string | null;
  specialties?: string[] | null;
  context?: string | null;
  /** YYYY-MM-DD */
  nextContact?: string | null;
  notes?: string | null;
}

export interface ValidContactRequest {
  name: string;
  companyId: string | null;
  companyName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  specialties: (string | null)[] | null;
  context: string | null;
  nextContact: string | null;
  notes: string | null;
}

export const contactRequestSchema = Joi.object<ValidContactRequest>({
  name: J.requiredText(120),
  companyId: J.optionalUuid(),
  companyName: J.optionalText(120),
  role: J.optionalText(120),
  email: J.optionalText(254),
  phone: J.optionalText(40),
  profileUrl: J.optionalText(2000),
  specialties: Joi.array()
    .items(Joi.string().allow('', null))
    .allow(null)
    .default([]),
  context: J.optionalText(2000),
  nextContact: J.optionalIsoDate(),
  notes: J.optionalText(5000),
});

export interface ContactListQuery {
  dueWithinDays: number | null;
}

export const contactListQuerySchema = Joi.object<ContactListQuery>({
  dueWithinDays: Joi.number().integer().min(0).default(null),
  ...J.paging(),
});
