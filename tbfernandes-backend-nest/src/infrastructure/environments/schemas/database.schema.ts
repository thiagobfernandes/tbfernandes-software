import Joi from 'joi';

/** Defaults match compose.yaml for local development; prod must set everything. */
const inProd = (schema: Joi.StringSchema, fallback: string) =>
  Joi.when('TBF_PROFILE', {
    is: 'prod',
    then: schema.required(),
    otherwise: schema.default(fallback),
  });

export const databaseEnvironmentSchema = Joi.object({
  DB_HOST: inProd(Joi.string(), 'localhost').messages({
    'any.required': `"DB_HOST" is a required field`,
  }),
  DB_PORT: Joi.number().port().default(5434).messages({
    'number.base': `"DB_PORT" should be a type of 'number'`,
  }),
  DB_USERNAME: inProd(Joi.string(), 'tbf').messages({
    'any.required': `"DB_USERNAME" is a required field`,
  }),
  DB_PASSWORD: inProd(Joi.string(), 'tbf').messages({
    'any.required': `"DB_PASSWORD" is a required field`,
  }),
  DB_NAME: inProd(Joi.string(), 'tbfernandes').messages({
    'any.required': `"DB_NAME" is a required field`,
  }),
  DB_LOGGING: Joi.boolean().default(false),
});
