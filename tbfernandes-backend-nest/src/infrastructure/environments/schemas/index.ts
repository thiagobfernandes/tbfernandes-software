import Joi from 'joi';
import { appEnvironmentSchema } from './app.schema';
import { authEnvironmentSchema } from './auth.schema';
import { databaseEnvironmentSchema } from './database.schema';
import { desktopEnvironmentSchema } from './desktop.schema';

/** Every variable the app reads, checked at startup: a missing one stops it with a clear message. */
export const ValidationSchema = [
  appEnvironmentSchema,
  databaseEnvironmentSchema,
  authEnvironmentSchema,
  desktopEnvironmentSchema,
].reduce((acc, schema) => acc.concat(schema), Joi.object());
