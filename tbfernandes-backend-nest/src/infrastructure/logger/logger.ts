/**
 * Application log, one line per event: `<ISO time> <level> <message>`. Same levels and route
 * markers as the INFRA project (`[---->]` request in, `[<----]` response out). With
 * LOG_FORMAT=json each line is a JSON object instead, for log collectors in production.
 */
export class Logger {
  private static json = process.env.LOG_FORMAT === 'json';
  private static silent = process.env.LOG_LEVEL === 'silent';

  static configure(options: { json?: boolean; silent?: boolean }): void {
    if (options.json !== undefined) this.json = options.json;
    if (options.silent !== undefined) this.silent = options.silent;
  }

  private static errorReplacer(
    this: void,
    _key: string,
    value: unknown,
  ): unknown {
    return value instanceof Error
      ? { name: value.name, message: value.message, stack: value.stack }
      : value;
  }

  private static log(level: string, message: string, error?: unknown): void {
    if (this.silent) return;
    const time = new Date().toJSON();
    const text = message.replace(/\r?\n/g, ' ');
    if (this.json) {
      const line: Record<string, unknown> = {
        time,
        level: level.replace(/[[\]\s]/g, ''),
        message: text,
      };
      if (error !== undefined)
        line.error = JSON.parse(
          JSON.stringify(error, this.errorReplacer),
        ) as unknown;
      console.log(JSON.stringify(line));
      return;
    }
    const suffix =
      error === undefined
        ? ''
        : ` ~ Exception: ${JSON.stringify(error, this.errorReplacer)}`;
    console.log(`${time} ${level} ${text}${suffix}`);
  }

  static startRoute(message: string): void {
    this.log('[---->]', message);
  }

  static finishRoute(message: string): void {
    this.log('[<----]', message);
  }

  static startJob(message: string): void {
    this.log('[~~~~>]', message);
  }

  static finishJob(message: string): void {
    this.log('[<~~~~]', message);
  }

  static debug(message: string): void {
    this.log('[DEBUG]', message);
  }

  static info(message: string): void {
    this.log('[INFO ]', message);
  }

  static warn(message: string, error?: unknown): void {
    this.log('[WARN ]', message, error);
  }

  static error(message: string, error?: unknown): void {
    this.log('[ERROR]', message, error);
  }
}
