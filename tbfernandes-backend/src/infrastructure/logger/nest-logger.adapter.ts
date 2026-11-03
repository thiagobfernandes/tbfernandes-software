import { LoggerService } from '@nestjs/common';
import { Logger } from './logger';

/** Sends Nest's own messages (startup, routes, errors) through the same Logger. */
export class NestLoggerAdapter implements LoggerService {
  log(message: unknown, context?: string): void {
    Logger.info(this.format(message, context));
  }

  error(message: unknown, trace?: string, context?: string): void {
    Logger.error(this.format(message, context), trace);
  }

  warn(message: unknown, context?: string): void {
    Logger.warn(this.format(message, context));
  }

  debug(message: unknown, context?: string): void {
    Logger.debug(this.format(message, context));
  }

  verbose(message: unknown, context?: string): void {
    Logger.debug(this.format(message, context));
  }

  private format(message: unknown, context?: string): string {
    const text =
      typeof message === 'string' ? message : JSON.stringify(message);
    return context ? `${context}: ${text}` : text;
  }
}
