import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { constants, promises as fs } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { Client } from 'pg';
import { Logger } from '../logger';

export const EMBEDDED_USER = 'tbf';
export const EMBEDDED_DATABASE = 'tbfernandes';
const WINDOWS = process.platform === 'win32';
const TIMEOUT_S = 90;

/** Connection settings of the running server. */
export interface EmbeddedConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address
          ? resolve(address.port)
          : reject(new Error('No free port')),
      );
    });
  });
}

/**
 * The PostgreSQL server of the desktop app, run from the binaries shipped with it (bin
 * directory with initdb and pg_ctl).
 * - First start: initdb in <dataDir>/pg with a random password kept in <dataDir>/db-password,
 *   listening only on 127.0.0.1, and the database created.
 * - Every start: a free port, and a server left over by a crash is stopped first.
 * - stop() shuts it down (fast mode: open transactions roll back).
 * Same data directory layout as the Java backend, so an existing install keeps its data.
 */
export class EmbeddedPostgres {
  private readonly pgData: string;
  private readonly logs: string;
  private readonly passwordFile: string;
  private running = false;
  private port = 0;
  private password = '';

  constructor(
    private readonly bin: string,
    dataDir: string,
  ) {
    this.pgData = join(dataDir, 'pg');
    this.logs = join(dataDir, 'logs');
    this.passwordFile = join(dataDir, 'db-password');
  }

  /**
   * Starts the server. whileStopped runs first, on a data directory that already existed, with
   * no server running, which is when its files can be copied safely (see DataBackup).
   */
  async start(
    whileStopped: (pgData: string) => Promise<void> = () => Promise.resolve(),
  ): Promise<EmbeddedConnection> {
    if (!this.running) {
      await fs.mkdir(this.logs, { recursive: true });
      const created = !(await this.exists(join(this.pgData, 'PG_VERSION')));
      if (created) await this.initialize();
      this.password = (await fs.readFile(this.passwordFile, 'utf8')).trim();
      await this.stopLeftover();
      if (!created) await whileStopped(this.pgData);
      this.port = await freePort();
      await this.run(
        [
          'start',
          '-D',
          this.pgData,
          '-w',
          '-t',
          String(TIMEOUT_S),
          '-l',
          join(this.logs, 'postgres.log'),
          '-o',
          `-p ${this.port}`,
        ],
        'pg_ctl-start.log',
      );
      this.running = true;
      await this.createDatabase();
      Logger.info(
        `Embedded PostgreSQL on 127.0.0.1:${this.port} (${this.pgData})`,
      );
    }
    return this.connection();
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    try {
      await this.run(
        [
          'stop',
          '-D',
          this.pgData,
          '-m',
          'fast',
          '-w',
          '-t',
          String(TIMEOUT_S),
        ],
        'pg_ctl-stop.log',
      );
      Logger.info('Embedded PostgreSQL stopped');
    } catch (error) {
      Logger.warn('Could not stop the embedded PostgreSQL', error);
    } finally {
      this.running = false;
    }
  }

  connection(): EmbeddedConnection {
    return {
      host: '127.0.0.1',
      port: this.port,
      username: EMBEDDED_USER,
      password: this.password,
      database: EMBEDDED_DATABASE,
    };
  }

  private async initialize(): Promise<void> {
    Logger.info(
      `Creating the embedded PostgreSQL data directory ${this.pgData}`,
    );
    const secret = randomBytes(24).toString('hex');
    await fs.writeFile(this.passwordFile, secret, {
      encoding: 'utf8',
      mode: 0o600,
    });
    // On Windows the file lives under %LOCALAPPDATA%, which only the user can read.
    // initdb reads the password from a file so it never shows in the process list.
    const pwfile = join(
      this.logs,
      `initdb-${randomBytes(6).toString('hex')}.tmp`,
    );
    try {
      await fs.writeFile(pwfile, secret, { encoding: 'utf8', mode: 0o600 });
      // Locale C: the same behavior on every Windows language; text search uses 'simple'.
      await this.exec(
        'initdb',
        [
          '-D',
          this.pgData,
          '-U',
          EMBEDDED_USER,
          `--pwfile=${pwfile}`,
          '-E',
          'UTF8',
          '--locale=C',
          '--auth=scram-sha-256',
        ],
        'initdb.log',
        true,
      );
    } finally {
      await fs.rm(pwfile, { force: true });
    }
    await fs.appendFile(
      join(this.pgData, 'postgresql.conf'),
      "# TBFernandes desktop: local connections over TCP only.\nlisten_addresses = '127.0.0.1'\nunix_socket_directories = ''\n",
      'utf8',
    );
  }

  /** A server still running from a previous launch that did not shut down cleanly. */
  private async stopLeftover(): Promise<void> {
    if (!(await this.exists(join(this.pgData, 'postmaster.pid')))) return;
    const status = await this.exec(
      'pg_ctl',
      ['status', '-D', this.pgData],
      'pg_ctl-status.log',
      false,
    );
    if (status === 0) {
      Logger.info('Stopping a PostgreSQL left running by a previous launch');
      await this.run(
        [
          'stop',
          '-D',
          this.pgData,
          '-m',
          'fast',
          '-w',
          '-t',
          String(TIMEOUT_S),
        ],
        'pg_ctl-stop.log',
      );
    }
  }

  private async createDatabase(): Promise<void> {
    const client = new Client({
      host: '127.0.0.1',
      port: this.port,
      user: EMBEDDED_USER,
      password: this.password,
      database: 'postgres',
    });
    await client.connect();
    try {
      const found = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [EMBEDDED_DATABASE],
      );
      if (found.rowCount === 0) {
        await client.query(
          `CREATE DATABASE ${EMBEDDED_DATABASE} ENCODING 'UTF8'`,
        );
        Logger.info(`Database ${EMBEDDED_DATABASE} created`);
      }
    } finally {
      await client.end();
    }
  }

  private run(args: string[], logName: string): Promise<number> {
    return this.exec('pg_ctl', args, logName, true);
  }

  /** Runs a PostgreSQL tool with its output in logs/<logName>; returns the exit code. */
  private async exec(
    name: string,
    args: string[],
    logName: string,
    mustSucceed: boolean,
  ): Promise<number> {
    const tool = join(this.bin, WINDOWS ? `${name}.exe` : name);
    try {
      await fs.access(tool, constants.X_OK);
    } catch {
      throw new Error(`PostgreSQL binary not found: ${tool} (TBF_PG_BIN)`);
    }
    const log = await fs.open(join(this.logs, logName), 'w');
    try {
      const code = await new Promise<number>((resolve, reject) => {
        const child = spawn(tool, args, {
          stdio: ['ignore', log.fd, log.fd],
          windowsHide: true,
        });
        const timer = setTimeout(
          () => {
            child.kill();
            reject(new Error(`'${name} ${args[0]}' timed out`));
          },
          (TIMEOUT_S + 10) * 1000,
        );
        child.once('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once('exit', (exit) => {
          clearTimeout(timer);
          resolve(exit ?? 1);
        });
      });
      if (mustSucceed && code !== 0) {
        throw new Error(
          `'${name} ${args[0]}' exited with ${code}; see ${join(this.logs, logName)}`,
        );
      }
      return code;
    } finally {
      await log.close();
    }
  }

  private exists(path: string): Promise<boolean> {
    return fs.stat(path).then(
      () => true,
      () => false,
    );
  }
}
