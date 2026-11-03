import { registerAs } from '@nestjs/config';
import { join } from 'node:path';
import type { Profile } from './app.register';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
  /** Folders of SQL migrations, applied in order (db/migration plus the profile's extras). */
  migrationLocations: string[];
}

/** The project's db/ folder (same path from src/ and dist/); TBF_DB_SCRIPTS overrides it. */
export const DB_ROOT =
  process.env.TBF_DB_SCRIPTS ?? join(__dirname, '..', '..', '..', '..', 'db');

export function migrationLocations(profile: Profile, root = DB_ROOT): string[] {
  const extra: Partial<Record<Profile, string>> = {
    dev: 'dev',
    test: 'dev',
    desktop: 'desktop',
  };
  const folders = ['migration', extra[profile]].filter(
    (folder): folder is string => !!folder,
  );
  return folders.map((folder) => join(root, folder));
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  username: process.env.DB_USERNAME ?? 'tbf',
  password: process.env.DB_PASSWORD ?? 'tbf',
  database: process.env.DB_NAME ?? 'tbfernandes',
  logging: process.env.DB_LOGGING === 'true',
  migrationLocations: migrationLocations(
    (process.env.TBF_PROFILE ?? 'dev') as Profile,
  ),
}));
