import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { Logger } from '../../infrastructure/logger';

/**
 * One line when a request comes in and one when its response leaves, with status and time
 * (from the INFRA project). The start is logged right away: waiting for 'readable' would skip
 * requests without a body.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    Logger.startRoute(
      `${req.method} ${req.originalUrl} HTTP/${req.httpVersion} ${req.headers['user-agent'] ?? ''}`,
    );

    res.once('finish', () => {
      const duration = Date.now() - startTime;
      Logger.finishRoute(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
