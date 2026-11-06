import { RequestFields, Joi } from '../../../common/protocols';

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
  name: RequestFields.requiredText(120),
  companyId: RequestFields.optionalUuid(),
  companyName: RequestFields.optionalText(120),
  role: RequestFields.optionalText(120),
  email: RequestFields.optionalText(254),
  phone: RequestFields.optionalText(40),
  profileUrl: RequestFields.optionalText(2000),
  specialties: Joi.array()
    .items(Joi.string().allow('', null))
    .allow(null)
    .default([]),
  context: RequestFields.optionalText(2000),
  nextContact: RequestFields.optionalIsoDate(),
  notes: RequestFields.optionalText(5000),
});

export interface ContactListQuery {
  dueWithinDays: number | null;
}

export const contactListQuerySchema = Joi.object<ContactListQuery>({
  dueWithinDays: Joi.number().integer().min(0).default(null),
  ...RequestFields.paging(),
});
