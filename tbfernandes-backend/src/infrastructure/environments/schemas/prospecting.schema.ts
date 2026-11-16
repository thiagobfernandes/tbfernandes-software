import Joi from 'joi';

export const prospectingEnvironmentSchema = Joi.object({
  PROSPECTING_INGEST_KEY: Joi.string().allow('').min(32).default('').messages({
    'string.min': `"PROSPECTING_INGEST_KEY" must have at least 32 characters`,
  }),
});
