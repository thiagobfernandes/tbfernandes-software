import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

/**
 * One fresh PostgreSQL database for the e2e run, like the Testcontainers setup of the Java
 * tests. With TBF_TEST_DB_HOST set (a PostgreSQL already running), a new database is created
 * there instead of starting a container.
 */
export default async function globalSetup(): Promise<void> {
  if (process.env.TBF_TEST_DB_HOST) {
    const name = `tbf_e2e_${Date.now()}`;
    const admin = {
      host: process.env.TBF_TEST_DB_HOST,
      port: Number(process.env.TBF_TEST_DB_PORT ?? 5432),
      user: process.env.TBF_TEST_DB_USER ?? 'tbf',
      password: process.env.TBF_TEST_DB_PASSWORD ?? 'tbf',
    };
    const client = new Client({ ...admin, database: 'postgres' });
    await client.connect();
    await client.query(`CREATE DATABASE ${name}`);
    await client.end();
    Object.assign(process.env, {
      DB_HOST: admin.host,
      DB_PORT: String(admin.port),
      DB_USERNAME: admin.user,
      DB_PASSWORD: admin.password,
      DB_NAME: name,
    });
    return;
  }
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('tbfernandes')
    .withUsername('tbf')
    .withPassword('tbf')
    .start();
  (globalThis as { __PG__?: unknown }).__PG__ = container;
  Object.assign(process.env, {
    DB_HOST: container.getHost(),
    DB_PORT: String(container.getPort()),
    DB_USERNAME: 'tbf',
    DB_PASSWORD: 'tbf',
    DB_NAME: 'tbfernandes',
  });
}
