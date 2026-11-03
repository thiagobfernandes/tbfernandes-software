import { Joi } from '../../../common/protocols';

export class PasswordRequest {
  current?: string | null;
  next: string | null;
}

/** Length rules live in the domain (RN-25), so a short password answers 422 with the rule. */
export const passwordRequestSchema = Joi.object<PasswordRequest>({
  current: Joi.string().allow(null, '').default(null),
  next: Joi.string().allow(null, '').default(null),
});
