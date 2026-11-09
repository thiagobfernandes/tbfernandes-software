import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

export type AuthMode = 'single-user' | 'session';

export interface AuthConfig {
  mode: AuthMode;
  ownerId: string;
  bootstrap: {
    email: string;
    password: string;
    name: string;
    resetPassword: boolean;
  };
  jwtSecret: string;
  jwtTtlSeconds: number;
  loginAttemptsPerMinute: number;
  cookieSecure: boolean;
  cookieDomain: string | undefined;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60;

function authMode(): AuthMode {
  const configured = process.env.TBF_AUTH_MODE as AuthMode | undefined;
  if (configured) return configured;
  return process.env.TBF_PROFILE === 'prod' ? 'session' : 'single-user';
}

function jwtSecret(): string {
  return (
    process.env.TBF_JWT_SECRET ||
    process.env.TBF_SESSION_SECRET ||
    randomBytes(32).toString('hex')
  );
}

export const authConfig = registerAs('auth', (): AuthConfig => ({
  mode: authMode(),
  ownerId:
    process.env.TBF_AUTH_OWNER_ID || '0192f000-0000-7000-8000-000000000001',
  bootstrap: {
    email: process.env.TBF_AUTH_BOOTSTRAP_EMAIL ?? '',
    password: process.env.TBF_AUTH_BOOTSTRAP_PASSWORD ?? '',
    name: process.env.TBF_AUTH_BOOTSTRAP_NAME ?? '',
    resetPassword: process.env.TBF_AUTH_BOOTSTRAP_RESET_PASSWORD === 'true',
  },
  jwtSecret: jwtSecret(),
  jwtTtlSeconds: Number(process.env.TBF_JWT_TTL_SECONDS) || SEVEN_DAYS,
  loginAttemptsPerMinute:
    Number(process.env.TBF_LOGIN_ATTEMPTS_PER_MINUTE) || 5,
  cookieSecure: process.env.TBF_COOKIE_SECURE === 'true',
  cookieDomain: process.env.TBF_COOKIE_DOMAIN || undefined,
}));
