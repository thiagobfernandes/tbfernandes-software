import { promises as fs } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { Logger } from '../logger';
import { ZipWriter } from './zip-writer';

const PREFIX = 'tbfernandes-';
/** Written by a running server; meaningless in a copy. */
const SKIPPED = new Set(['postmaster.pid', 'postmaster.opts']);

export interface BackupSettings {
  backupDir: string;
  keep: number;
  intervalMs: number;
  appVersion: string;
  versionFile: string;
  now?: () => Date;
}

const pad = (value: number) => String(value).padStart(2, '0');
const stamp = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

async function exists(path: string): Promise<boolean> {
  return fs.stat(path).then(
    () => true,
    () => false,
  );
}

/**
 * Backups of the desktop app's database: a zip of the PostgreSQL data directory, taken while
 * the server is stopped (so the copy is consistent), before it starts.
 * - When: once the last backup is older than the interval, or when the app version changed
 *   (an update may run new migrations).
 * - Where: backupDir (Documents\TBFernandes\backups in the app), keeping the newest `keep`.
 * - Restore: close the app, replace <data dir>/pg with the zip's contents.
 * The binaries shipped with the app have no pg_dump, hence a file-level copy.
 */
export class DataBackup {
  private readonly keep: number;
  private readonly now: () => Date;

  constructor(private readonly settings: BackupSettings) {
    this.keep = Math.max(1, settings.keep);
    this.now = settings.now ?? (() => new Date());
  }

  /** Backs up pgData if one is due. A failed backup is logged and never blocks the app. */
  async runIfDue(pgData: string): Promise<void> {
    try {
      const reason = await this.dueReason();
      if (reason) {
        const file = await this.write(pgData);
        Logger.info(`Backup ${file} (${reason})`);
        await this.prune();
      }
      await fs.writeFile(
        this.settings.versionFile,
        this.settings.appVersion,
        'utf8',
      );
    } catch (error) {
      Logger.warn('Backup failed; the app starts anyway', error);
    }
  }

  async dueReason(): Promise<string | null> {
    const { versionFile, appVersion, intervalMs } = this.settings;
    if (await exists(versionFile)) {
      const last = (await fs.readFile(versionFile, 'utf8')).trim();
      if (last !== appVersion)
        return `app updated from ${last} to ${appVersion}`;
    }
    const newest = (await this.backups())[0];
    if (!newest) return 'first backup';
    return this.now().getTime() - newest.modified >= intervalMs
      ? `last one is older than ${Math.round(intervalMs / 3_600_000)} h`
      : null;
  }

  async backups(): Promise<Array<{ path: string; modified: number }>> {
    const dir = this.settings.backupDir;
    if (!(await exists(dir))) return [];
    const names = (await fs.readdir(dir)).filter(
      (fileName) => fileName.startsWith(PREFIX) && fileName.endsWith('.zip'),
    );
    const files = await Promise.all(
      names.map(async (fileName) => ({
        path: join(dir, fileName),
        modified: (await fs.stat(join(dir, fileName))).mtimeMs,
      })),
    );
    return files.sort((left, right) => right.modified - left.modified);
  }

  private async write(pgData: string): Promise<string> {
    const dir = this.settings.backupDir;
    await fs.mkdir(dir, { recursive: true });
    const target = join(dir, `${PREFIX}${stamp(this.now())}.zip`);
    const partial = `${target}.partial`;
    const zip = new ZipWriter(partial);
    try {
      for (const file of await walk(pgData)) {
        const name = relative(pgData, file).split(sep).join('/');
        if (SKIPPED.has(name.split('/').pop()!)) continue;
        const stat = await fs.stat(file);
        await zip.add(name, await fs.readFile(file), stat.mtime);
      }
      await zip.close();
    } catch (error) {
      zip.abort();
      await fs.rm(partial, { force: true });
      throw error;
    }
    await fs.rename(partial, target);
    return target;
  }

  private async prune(): Promise<void> {
    for (const old of (await this.backups()).slice(this.keep)) {
      await fs.rm(old.path, { force: true });
    }
  }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return walk(path);
      return Promise.resolve(entry.isFile() ? [path] : []);
    }),
  );
  return nested.flat();
}
