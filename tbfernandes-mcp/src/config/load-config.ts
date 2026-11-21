import { defaultEnvFilePath, loadEnvFile } from './env-file.ts';

const DEFAULT_API_URL = 'https://api.software.tbfernandes.com.br/api/v1';
const DEFAULT_WEB_URL = 'https://software.tbfernandes.com.br';

export interface Config {
  apiUrl: string;
  webUrl: string;
  email: string | undefined;
  password: string | undefined;
}

export function loadConfig(): Config {
  loadEnvFile(process.env['TBF_ENV_FILE'] ?? defaultEnvFilePath());
  return {
    apiUrl: process.env['TBF_API_URL'] ?? DEFAULT_API_URL,
    webUrl: process.env['TBF_WEB_URL'] ?? DEFAULT_WEB_URL,
    email: process.env['TBF_EMAIL'],
    password: process.env['TBF_PASSWORD'],
  };
}
