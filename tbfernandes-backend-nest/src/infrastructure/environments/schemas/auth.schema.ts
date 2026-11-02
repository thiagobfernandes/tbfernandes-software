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
  TBF_COOKIE_SECURE: Joi.boolean().default(false),
});
