import { registerAs } from '@nestjs/config';

/** Open finance through Pluggy. Off unless PLUGGY_ENABLED=true (RN-15); secrets only from the environment. */
export interface PluggyConfig {
  enabled: boolean;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  /** Pluggy sends it back on every webhook. Empty: every webhook is refused. */
  webhookSecret: string;
}

export const pluggyConfig = registerAs('pluggy', (): PluggyConfig => ({
  enabled: process.env.PLUGGY_ENABLED === 'true',
  baseUrl: process.env.PLUGGY_BASE_URL ?? 'https://api.pluggy.ai',
  clientId: process.env.PLUGGY_CLIENT_ID ?? '',
  clientSecret: process.env.PLUGGY_CLIENT_SECRET ?? '',
  webhookSecret: process.env.PLUGGY_WEBHOOK_SECRET ?? '',
}));
