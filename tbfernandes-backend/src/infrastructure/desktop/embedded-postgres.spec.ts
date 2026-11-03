import { existsSync, mkdtempSync, promises as fs, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { Logger } from '../logger';
import { EmbeddedPostgres } from './embedded-postgres';

/**
 * Runs against a PostgreSQL installed on the machine (TBF_TEST_PG_BIN, or the newest
 * /usr/lib/postgresql/<n>/bin, which GitHub's Ubuntu runners have). Skipped without one, and
 * as root, since initdb refuses to run as root.
 */
function postgresBin(): string | null {
  if (process.env.TBF_TEST_PG_BIN) return process.env.TBF_TEST_PG_BIN;
  const root = '/usr/lib/postgresql';
  if (!existsSync(root)) return null;
  const versions = readdirSync(root)
    .filter((v) => existsSync(join(root, v, 'bin', 'initdb')))
    .sort((a, b) => Number(b) - Number(a));
  return versions.length ? join(root, versions[0], 'bin') : null;
}

const bin = postgresBin();
const runnable = bin !== null && process.getuid?.() !== 0;

(runnable ? describe : describe.skip)('EmbeddedPostgres', () => {
  let dataDir: string;

  beforeAll(() => Logger.configure({ silent: true }));
  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'tbf-pg-'));
  });
  afterEach(() => fs.rm(dataDir, { recursive: true, force: true }));

  const query = async (
    db: Awaited<ReturnType<EmbeddedPostgres['start']>>,
    sql: string,
  ) => {
    const client = new Client({ ...db, user: db.username });
    await client.connect();
    try {
      return await client.query<{ value: string }>(sql);
    } finally {
      await client.end();
    }
  };

  it('initializes, restarts and keeps the data', async () => {
    const first = new EmbeddedPostgres(bin!, dataDir);
    const db = await first.start();
    await query(
      db,
      "CREATE TABLE kept (value text); INSERT INTO kept VALUES ('ok')",
    );
    await first.stop();

    const copied: string[] = [];
    const second = new EmbeddedPostgres(bin!, dataDir);
    const again = await second.start((pgData) => {
      copied.push(pgData);
      return Promise.resolve();
    });
    try {
      expect((await query(again, 'SELECT value FROM kept')).rows).toEqual([
        { value: 'ok' },
      ]);
      expect(copied).toEqual([join(dataDir, 'pg')]);
    } finally {
      await second.stop();
    }
    expect(
      (await fs.readFile(join(dataDir, 'db-password'), 'utf8')).length,
    ).toBeGreaterThanOrEqual(32);
  }, 120_000);
});
