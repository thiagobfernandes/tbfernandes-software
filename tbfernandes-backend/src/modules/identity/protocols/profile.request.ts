import { RequestFields, Joi } from '../../../common/protocols';

export class ProfileRequest {
  name: string;
  email: string;
  locale?: string | null;
  timeZone?: string | null;
}

export const profileRequestSchema = Joi.object<ProfileRequest>({
  name: RequestFields.requiredText(120),
  email: RequestFields.requiredText(254),
  locale: RequestFields.optionalText(10),
  timeZone: RequestFields.optionalText(40),
});
