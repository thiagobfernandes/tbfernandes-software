import { registerAs } from '@nestjs/config';

export type Profile = 'dev' | 'prod' | 'desktop' | 'test';

export interface AppConfig {
  profile: Profile;
  port: number;
  host: string;
  timeZone: string;
  swagger: boolean;
  trustProxy: boolean;
  corsOrigins: string[];
}

const DESKTOP_CORS_ORIGINS = [
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost',
];

// The desktop backend answers only on this PC.
const hostFor = (profile: Profile) =>
  profile === 'desktop' ? '127.0.0.1' : (process.env.HOST ?? '0.0.0.0');

const swaggerEnabled = (profile: Profile) =>
  process.env.TBF_SWAGGER
    ? process.env.TBF_SWAGGER === 'true'
    : profile === 'dev' || profile === 'test';

const corsOriginsFor = (profile: Profile) =>
  profile === 'desktop'
    ? DESKTOP_CORS_ORIGINS
    : (process.env.TBF_CORS_ORIGINS ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

export const appConfig = registerAs('app', (): AppConfig => {
  const profile = (process.env.TBF_PROFILE ?? 'dev') as Profile;
  return {
    profile,
    port: Number(process.env.TBF_PORT ?? process.env.PORT ?? 8080),
    host: hostFor(profile),
    timeZone: process.env.TBF_TIME_ZONE ?? 'America/Sao_Paulo',
    swagger: swaggerEnabled(profile),
    trustProxy: process.env.TBF_TRUST_PROXY === 'true' || profile === 'prod',
    corsOrigins: corsOriginsFor(profile),
  };
});
