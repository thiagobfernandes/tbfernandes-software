import Joi from 'joi';

export const assistantEnvironmentSchema = Joi.object({
  TBF_ASSISTANT_MODEL: Joi.string()
    .valid('none', 'anthropic', 'openai-compatible')
    .empty('')
    .default('none'),
  TBF_ASSISTANT_MODEL_NAME: Joi.string().empty('').optional(),
  ANTHROPIC_API_KEY: Joi.when('TBF_ASSISTANT_MODEL', {
    is: 'anthropic',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  TBF_ASSISTANT_MODEL_BASE_URL: Joi.string()
    .uri()
    .empty('')
    .default('https://api.groq.com/openai/v1'),
  TBF_ASSISTANT_MODEL_API_KEY: Joi.string().allow('').default(''),
  TBF_ASSISTANT_EMBEDDING: Joi.string()
    .valid('none', 'voyage', 'ollama')
    .empty('')
    .default('none'),
  TBF_ASSISTANT_EMBEDDING_NAME: Joi.string().empty('').optional(),
  VOYAGE_BASE_URL: Joi.string()
    .uri()
    .empty('')
    .default('https://api.voyageai.com'),
  VOYAGE_API_KEY: Joi.when('TBF_ASSISTANT_EMBEDDING', {
    is: 'voyage',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  OLLAMA_BASE_URL: Joi.string()
    .uri()
    .empty('')
    .default('http://localhost:11434'),
  TBF_ASSISTANT_TRACING: Joi.string()
    .valid('none', 'langfuse')
    .empty('')
    .default('none'),
  LANGFUSE_PUBLIC_KEY: Joi.when('TBF_ASSISTANT_TRACING', {
    is: 'langfuse',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  LANGFUSE_SECRET_KEY: Joi.when('TBF_ASSISTANT_TRACING', {
    is: 'langfuse',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  LANGFUSE_BASE_URL: Joi.string()
    .uri()
    .empty('')
    .default('https://cloud.langfuse.com'),
});
