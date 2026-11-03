import { Joi } from '../../../common/protocols';

export class LoginRequest {
  email: string;
  password: string;
}

export const loginRequestSchema = Joi.object<LoginRequest>({
  email: Joi.string().trim().required(),
  password: Joi.string().required(),
});
