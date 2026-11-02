import { J, Joi } from '../../../common/protocols';

export class ProfileRequest {
  name: string;
  email: string;
  locale?: string | null;
  timeZone?: string | null;
}

export const profileRequestSchema = Joi.object<ProfileRequest>({
  name: J.requiredText(120),
  email: J.requiredText(254),
  locale: J.optionalText(10),
  timeZone: J.optionalText(40),
});
