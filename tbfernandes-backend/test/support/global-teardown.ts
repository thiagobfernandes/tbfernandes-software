import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalTeardown(): Promise<void> {
  const container = (globalThis as { __PG__?: StartedPostgreSqlContainer })
    .__PG__;
  if (container) await container.stop();
}
