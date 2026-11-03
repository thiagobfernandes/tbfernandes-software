import Joi from 'joi';

export const assistantEnvironmentSchema = Joi.object({
  TBF_ASSISTANT_MODEL: Joi.string().valid('none', 'anthropic').default('none'),
  TBF_ASSISTANT_MODEL_NAME: Joi.string().default('claude-opus-5-5'),
  ANTHROPIC_API_KEY: Joi.when('TBF_ASSISTANT_MODEL', {
    is: 'anthropic',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  TBF_ASSISTANT_EMBEDDING: Joi.string().valid('none', 'voyage').default('none'),
  TBF_ASSISTANT_EMBEDDING_NAME: Joi.string().default('voyage-3.5-lite'),
  VOYAGE_BASE_URL: Joi.string().uri().default('https://api.voyageai.com'),
  VOYAGE_API_KEY: Joi.when('TBF_ASSISTANT_EMBEDDING', {
    is: 'voyage',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
});
