import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  authConfig,
  databaseConfig,
  desktopConfig,
  pluggyConfig,
} from './registers';
import { ValidationSchema } from './schemas';

/**
 * Variables from the environment (and .env / .env.local in development), grouped by
 * namespace with registerAs and validated with Joi at startup (ADR-001 of my-self.so).
 * A new variable goes in its register and in its schema.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: ValidationSchema,
      validationOptions: { abortEarly: false, allowUnknown: true },
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        desktopConfig,
        pluggyConfig,
      ],
    }),
  ],
})
export class EnvironmentModule {}
