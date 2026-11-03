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

export const appConfig = registerAs('app', (): AppConfig => {
  const profile = (process.env.TBF_PROFILE ?? 'dev') as Profile;
  const desktop = profile === 'desktop';
  return {
    profile,
    port: Number(process.env.TBF_PORT ?? process.env.PORT ?? 8080),
    // The desktop backend answers only on this PC.
    host: desktop ? '127.0.0.1' : (process.env.HOST ?? '0.0.0.0'),
    timeZone: process.env.TBF_TIME_ZONE ?? 'America/Sao_Paulo',
    swagger: process.env.TBF_SWAGGER
      ? process.env.TBF_SWAGGER === 'true'
      : profile === 'dev' || profile === 'test',
    trustProxy: process.env.TBF_TRUST_PROXY === 'true' || profile === 'prod',
    corsOrigins: desktop
      ? [
          'http://tauri.localhost',
          'https://tauri.localhost',
          'tauri://localhost',
        ]
      : (process.env.TBF_CORS_ORIGINS ?? 'http://localhost:3000')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
  };
});
