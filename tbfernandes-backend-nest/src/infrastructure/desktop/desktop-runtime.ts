import { join } from 'node:path';
import { Logger } from '../logger';
import { DataBackup } from './data-backup';
import { EmbeddedPostgres } from './embedded-postgres';

const BACKUPS_KEPT = 7;
const BACKUP_INTERVAL_MS = 20 * 60 * 60 * 1000;
const PARENT_CHECK_MS = 2000;

/**
 * What the desktop profile needs before Nest starts (docs/desktop.md): its own PostgreSQL,
 * a backup when one is due, and a way to exit cleanly when the app asks or disappears.
 */
export class DesktopRuntime {
  private exitHandler: (() => Promise<void>) | null = null;
  private exiting = false;
  private watcher: NodeJS.Timeout | null = null;

  private constructor(readonly postgres: EmbeddedPostgres) {}

  /**
   * Validates the variables the Windows app sets, starts PostgreSQL and points DB_* at it,
   * so the database settings Nest reads are the embedded server's.
   */
  static async start(
    env: NodeJS.ProcessEnv = process.env,
  ): Promise<DesktopRuntime> {
    const dataDir = env.TBF_DATA_DIR ?? '';
    const bin = env.TBF_PG_BIN ?? '';
    if (!dataDir || !bin) {
      throw new Error('The desktop profile needs TBF_DATA_DIR and TBF_PG_BIN');
    }
    if ((env.TBF_DESKTOP_TOKEN ?? '').length < 32) {
      throw new Error(
        'The desktop profile needs TBF_DESKTOP_TOKEN with at least 32 characters',
      );
    }
    const backup = new DataBackup({
      backupDir: env.TBF_BACKUP_DIR || join(dataDir, 'backups'),
      keep: BACKUPS_KEPT,
      intervalMs: BACKUP_INTERVAL_MS,
      appVersion: env.TBF_APP_VERSION ?? '',
      versionFile: join(dataDir, 'app-version'),
    });
    const postgres = new EmbeddedPostgres(bin, dataDir);
    const db = await postgres.start((pgData) => backup.runIfDue(pgData));
    Object.assign(env, {
      DB_HOST: db.host,
      DB_PORT: String(db.port),
      DB_USERNAME: db.username,
      DB_PASSWORD: db.password,
      DB_NAME: db.database,
    });
    const runtime = new DesktopRuntime(postgres);
    current = runtime;
    return runtime;
  }

  /** What exit() runs before PostgreSQL stops: closing the Nest app. */
  onExit(handler: () => Promise<void>): void {
    this.exitHandler = handler;
  }

  /** Exits when the app's process is gone, even if it was killed without closing the backend. */
  watchParent(pid: number | null): void {
    if (!pid) return;
    this.watcher = setInterval(() => {
      if (!isAlive(pid)) {
        Logger.info(`The desktop app (pid ${pid}) is gone; shutting down`);
        void this.exit();
      }
    }, PARENT_CHECK_MS);
    this.watcher.unref();
  }

  /** Closes the app, stops PostgreSQL and ends the process. Safe to call more than once. */
  async exit(code = 0): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;
    if (this.watcher) clearInterval(this.watcher);
    try {
      await this.exitHandler?.();
    } catch (error) {
      Logger.error('Could not close the app cleanly', error);
    }
    await this.postgres.stop();
    process.exit(code);
  }
}

let current: DesktopRuntime | null = null;

/** The runtime of this process, or null outside the desktop profile. */
export const desktopRuntime = (): DesktopRuntime | null => current;

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}
