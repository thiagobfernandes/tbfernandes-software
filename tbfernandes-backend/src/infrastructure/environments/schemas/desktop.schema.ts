import Joi from 'joi';

/** Set by the Windows app when it starts the backend (docs/desktop.md). */
export const desktopEnvironmentSchema = Joi.object({
  TBF_DESKTOP_TOKEN: Joi.when('TBF_PROFILE', {
    is: 'desktop',
    then: Joi.string().min(16).required().messages({
      'any.required': `"TBF_DESKTOP_TOKEN" is required in the desktop profile`,
    }),
    otherwise: Joi.string().allow('').default(''),
  }),
  TBF_DATA_DIR: Joi.string().allow('').default(''),
  TBF_PG_BIN: Joi.string().allow('').default(''),
  TBF_PARENT_PID: Joi.number().integer().allow('').default(''),
  TBF_APP_VERSION: Joi.string().allow('').default(''),
  TBF_BACKUP_DIR: Joi.string().allow('').default(''),
});
