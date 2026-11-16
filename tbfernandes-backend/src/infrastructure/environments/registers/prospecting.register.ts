import { registerAs } from '@nestjs/config';

/** Automated prospecting (PRS). The worker on the user's computer sends leads with this key. */
export interface ProspectingConfig {
  /** Empty: every call from the worker is refused. */
  ingestKey: string;
  /** The account that owns what the worker sends (same as TBF_AUTH_OWNER_ID). */
  ownerId: string;
}

export const prospectingConfig = registerAs(
  'prospecting',
  (): ProspectingConfig => ({
    ingestKey: process.env.PROSPECTING_INGEST_KEY ?? '',
    ownerId:
      process.env.TBF_AUTH_OWNER_ID || '0192f000-0000-7000-8000-000000000001',
  }),
);
