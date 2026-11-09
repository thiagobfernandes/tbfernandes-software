import Joi from 'joi';

export const authEnvironmentSchema = Joi.object({
  TBF_AUTH_MODE: Joi.when('TBF_PROFILE', {
    is: 'prod',
    then: Joi.string().valid('session').default('session').messages({
      'any.only': `"TBF_AUTH_MODE" must be session in the prod profile`,
    }),
    otherwise: Joi.string()
      .valid('single-user', 'session')
      .default('single-user'),
  }),
  TBF_AUTH_OWNER_ID: Joi.string()
    .guid()
    .default('0192f000-0000-7000-8000-000000000001'),
  TBF_AUTH_BOOTSTRAP_EMAIL: Joi.string().allow('').default(''),
  TBF_AUTH_BOOTSTRAP_PASSWORD: Joi.string().allow('').default(''),
  TBF_AUTH_BOOTSTRAP_NAME: Joi.string().allow('').default(''),
  TBF_SESSION_SECRET: Joi.string().allow('').default(''),
  TBF_JWT_SECRET: Joi.string().allow('').min(32).default('').messages({
    'string.min': `"TBF_JWT_SECRET" must have at least 32 characters`,
  }),
  TBF_JWT_TTL_SECONDS: Joi.number().integer().min(300).default(604800),
  TBF_LOGIN_ATTEMPTS_PER_MINUTE: Joi.number().integer().min(1).default(5),
  TBF_AUTH_BOOTSTRAP_RESET_PASSWORD: Joi.boolean().default(false),
  TBF_COOKIE_SECURE: Joi.boolean().default(false),
  TBF_COOKIE_DOMAIN: Joi.string().allow('').default(''),
});
