import Joi from 'joi';
import { appEnvironmentSchema } from './app.schema';
import { assistantEnvironmentSchema } from './assistant.schema';
import { authEnvironmentSchema } from './auth.schema';
import { databaseEnvironmentSchema } from './database.schema';
import { desktopEnvironmentSchema } from './desktop.schema';
import { pluggyEnvironmentSchema } from './pluggy.schema';

export const ValidationSchema = [
  appEnvironmentSchema,
  databaseEnvironmentSchema,
  authEnvironmentSchema,
  desktopEnvironmentSchema,
  pluggyEnvironmentSchema,
  assistantEnvironmentSchema,
].reduce((acc, schema) => acc.concat(schema), Joi.object());
