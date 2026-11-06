import { execFileSync } from 'node:child_process';
import { mkdtempSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '../logger';
import { DataBackup } from './data-backup';

describe('DataBackup', () => {
  let dir: string;
  let pgData: string;
  let backups: string;
  let now: Date;

  beforeAll(() => Logger.configure({ silent: true }));

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'tbf-backup-'));
    pgData = join(dir, 'pg');
    backups = join(dir, 'backups');
    await fs.mkdir(join(pgData, 'base', '1'), { recursive: true });
    await fs.writeFile(join(pgData, 'PG_VERSION'), '17');
    await fs.writeFile(join(pgData, 'base', '1', '1259'), 'table data');
    await fs.writeFile(join(pgData, 'postmaster.pid'), '1234');
    now = new Date('2026-11-01T10:00:00Z');
  });

  afterEach(() => fs.rm(dir, { recursive: true, force: true }));

  const backup = (version: string) =>
    new DataBackup({
      backupDir: backups,
      keep: 3,
      intervalMs: 20 * 3_600_000,
      appVersion: version,
      versionFile: join(dir, 'app-version'),
      now: () => now,
    });

  async function run(version: string) {
    const before = new Set(
      (await backup(version).backups()).map((file) => file.path),
    );
    await backup(version).runIfDue(pgData);
    for (const file of await backup(version).backups()) {
      if (!before.has(file.path)) await fs.utimes(file.path, now, now);
    }
  }

  it('zips the data directory without the server pid file', async () => {
    await backup('1.0.0').runIfDue(pgData);
    const files = await backup('1.0.0').backups();
    expect(files).toHaveLength(1);
    const names = execFileSync('unzip', ['-Z1', files[0].path], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .sort();
    expect(names).toEqual(['PG_VERSION', 'base/1/1259']);
    expect(
      execFileSync('unzip', ['-p', files[0].path, 'base/1/1259'], {
        encoding: 'utf8',
      }),
    ).toBe('table data');
    execFileSync('unzip', ['-tq', files[0].path]);
  });

  it('backs up again only after the interval or an update', async () => {
    await run('1.0.0');
    await run('1.0.0');
    expect(await backup('1.0.0').backups()).toHaveLength(1);

    now = new Date(now.getTime() + 21 * 3_600_000);
    await run('1.0.0');
    expect(await backup('1.0.0').backups()).toHaveLength(2);

    now = new Date(now.getTime() + 60_000);
    await run('1.1.0');
    expect(await backup('1.1.0').backups()).toHaveLength(3);
  });

  it('keeps only the newest', async () => {
    for (let index = 0; index < 5; index++) {
      await run('1.0.0');
      now = new Date(now.getTime() + 24 * 3_600_000);
    }
    expect(await backup('1.0.0').backups()).toHaveLength(3);
  });

  it('never blocks the start when the backup fails', async () => {
    await expect(
      backup('1.0.0').runIfDue(join(dir, 'missing')),
    ).resolves.toBeUndefined();
    expect(await backup('1.0.0').backups()).toHaveLength(0);
  });
});
