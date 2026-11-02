import { DataSource, QueryRunner } from 'typeorm';
import { Logger } from '../../logger';
import { loadScripts, MigrationScript } from './migration-script';

const HISTORY = 'flyway_schema_history';
/** Any number works; it only has to be the same for every instance of the app. */
const LOCK_KEY = 7_315_002;

interface AppliedRow {
  version: string | null;
  script: string;
  checksum: number | null;
  success: boolean;
}

/**
 * Applies the SQL migrations in db/ the way Flyway did, in the same history table: a database
 * the Java backend migrated keeps working, and new scripts follow the same naming
 * (`V<n>__<description>.sql`, never edited once applied; `R__` scripts rerun when they change).
 * Each script runs in its own transaction; an advisory lock keeps two instances apart.
 */
export class SqlMigrator {
  constructor(
    private readonly dataSource: DataSource,
    private readonly locations: string[],
  ) {}

  async migrate(): Promise<number> {
    const scripts = loadScripts(this.locations);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
      await this.createHistory(runner);
      const applied = (await runner.query(
        `SELECT version, script, checksum, success FROM ${HISTORY} ORDER BY installed_rank`,
      )) as AppliedRow[];
      this.refuseFailed(applied);
      let count = 0;
      for (const script of scripts) {
        if (this.isApplied(script, applied)) continue;
        await this.apply(runner, script);
        count++;
      }
      Logger.info(
        count
          ? `Database migrated: ${count} script(s) applied`
          : 'Database is up to date',
      );
      return count;
    } finally {
      await runner
        .query('SELECT pg_advisory_unlock($1)', [LOCK_KEY])
        .catch(() => undefined);
      await runner.release();
    }
  }

  private async createHistory(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS ${HISTORY} (
        installed_rank integer PRIMARY KEY,
        version varchar(50),
        description varchar(200) NOT NULL,
        type varchar(20) NOT NULL,
        script varchar(1000) NOT NULL,
        checksum integer,
        installed_by varchar(100) NOT NULL,
        installed_on timestamp NOT NULL DEFAULT now(),
        execution_time integer NOT NULL,
        success boolean NOT NULL
      )`);
    await runner.query(
      `CREATE INDEX IF NOT EXISTS ${HISTORY}_s_idx ON ${HISTORY} (success)`,
    );
  }

  private refuseFailed(applied: AppliedRow[]): void {
    const failed = applied.find((row) => !row.success);
    if (failed) {
      throw new Error(
        `Migration ${failed.script} failed before; fix the database and remove its history row`,
      );
    }
  }

  private isApplied(script: MigrationScript, applied: AppliedRow[]): boolean {
    if (script.kind === 'versioned') {
      const row = applied.find((r) => r.version === script.version);
      if (row && row.checksum !== script.checksum) {
        Logger.warn(
          `Migration ${script.script} changed after it was applied; applied migrations must not be edited`,
        );
      }
      return !!row;
    }
    const last = applied
      .filter((r) => r.version === null && r.script === script.script)
      .pop();
    return !!last && last.checksum === script.checksum;
  }

  private async apply(
    runner: QueryRunner,
    script: MigrationScript,
  ): Promise<void> {
    const started = Date.now();
    await runner.startTransaction();
    try {
      await runner.query(script.sql);
      await runner.query(
        `INSERT INTO ${HISTORY} (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
         VALUES ((SELECT coalesce(max(installed_rank), 0) + 1 FROM ${HISTORY}), $1, $2, 'SQL', $3, $4, current_user, $5, true)`,
        [
          script.version,
          script.description,
          script.script,
          script.checksum,
          Date.now() - started,
        ],
      );
      await runner.commitTransaction();
      Logger.info(`Applied ${script.script}`);
    } catch (error) {
      await runner.rollbackTransaction();
      throw new Error(
        `Migration ${script.script} failed: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }
}
