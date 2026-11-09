import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

export type AuthMode = 'single-user' | 'session';

export interface AuthConfig {
  /** single-user: no login, every request acts as ownerId. session: login required. */
  mode: AuthMode;
  ownerId: string;
  bootstrap: { email: string; password: string; name: string };
  sessionSecret: string;
  cookieSecure: boolean;
  cookieDomain: string | undefined;
}

export const authConfig = registerAs('auth', (): AuthConfig => ({
  mode:
    (process.env.TBF_AUTH_MODE as AuthMode) ||
    (process.env.TBF_PROFILE === 'prod' ? 'session' : 'single-user'),
  ownerId:
    process.env.TBF_AUTH_OWNER_ID || '0192f000-0000-7000-8000-000000000001',
  bootstrap: {
    email: process.env.TBF_AUTH_BOOTSTRAP_EMAIL ?? '',
    password: process.env.TBF_AUTH_BOOTSTRAP_PASSWORD ?? '',
    name: process.env.TBF_AUTH_BOOTSTRAP_NAME ?? '',
  },
  // Without a configured secret, sessions last until the next restart (they live in memory anyway).
  sessionSecret:
    process.env.TBF_SESSION_SECRET || randomBytes(32).toString('hex'),
  cookieSecure: process.env.TBF_COOKIE_SECURE === 'true',
  cookieDomain: process.env.TBF_COOKIE_DOMAIN || undefined,
}));
