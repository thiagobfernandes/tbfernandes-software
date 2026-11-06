import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { sendProblem } from '../../../../common/protocols/problem-detail';

export const CSRF_COOKIE = 'XSRF-TOKEN';
export const CSRF_HEADER = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Called by external services with their own secret, never by the browser. */
const EXEMPT = ['/api/v1/webhooks/'];

function same(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Session mode only. Double-submit CSRF token: the XSRF-TOKEN cookie (readable by the
 * frontend) must come back in the X-XSRF-TOKEN header on every write, login included.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const cookies = req.cookies as
      Record<string, string | undefined> | undefined;
    const cookie = cookies?.[CSRF_COOKIE];
    if (!cookie) {
      res.cookie(CSRF_COOKIE, randomUUID(), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
      });
    }
    if (
      SAFE_METHODS.has(req.method) ||
      EXEMPT.some((prefix) => req.originalUrl.startsWith(prefix))
    ) {
      next();
      return;
    }
    const header = req.headers[CSRF_HEADER];
    if (!cookie || typeof header !== 'string' || !same(cookie, header)) {
      sendProblem(res, {
        status: 403,
        detail: 'Token CSRF ausente ou inválido',
      });
      return;
    }
    next();
  }
}
