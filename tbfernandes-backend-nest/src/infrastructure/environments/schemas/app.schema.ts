import Joi from 'joi';

export const appEnvironmentSchema = Joi.object({
  TBF_PROFILE: Joi.string()
    .valid('dev', 'prod', 'desktop', 'test')
    .default('dev')
    .messages({
      'any.only': `"TBF_PROFILE" must be one of dev, prod, desktop, test`,
    }),
  PORT: Joi.number().port().default(8080).messages({
    'number.base': `"PORT" should be a type of 'number'`,
  }),
  TBF_PORT: Joi.number().port().messages({
    'number.base': `"TBF_PORT" should be a type of 'number'`,
  }),
  HOST: Joi.string().default('0.0.0.0'),
  TBF_TIME_ZONE: Joi.string().default('America/Sao_Paulo'),
  TBF_SWAGGER: Joi.boolean(),
  TBF_TRUST_PROXY: Joi.boolean().default(false),
  LOG_FORMAT: Joi.string().valid('text', 'json').default('text'),
  TBF_CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});
