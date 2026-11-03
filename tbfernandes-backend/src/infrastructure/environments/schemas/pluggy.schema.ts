import Joi from 'joi';

export const pluggyEnvironmentSchema = Joi.object({
  PLUGGY_ENABLED: Joi.boolean().default(false),
  PLUGGY_BASE_URL: Joi.string().uri().default('https://api.pluggy.ai'),
  PLUGGY_CLIENT_ID: Joi.when('PLUGGY_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  PLUGGY_CLIENT_SECRET: Joi.when('PLUGGY_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  PLUGGY_WEBHOOK_SECRET: Joi.string().allow('').default(''),
});
