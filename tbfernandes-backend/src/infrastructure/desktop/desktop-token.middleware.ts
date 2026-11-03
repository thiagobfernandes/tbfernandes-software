import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { sendProblem } from '../../common/protocols/problem-detail';

export const DESKTOP_TOKEN_HEADER = 'x-tbf-desktop-token';

/**
 * Desktop profile. A backend on 127.0.0.1 can be called by any page open in the user's
 * browser; only the Windows app knows the launch token, so every request without it gets
 * 401. CORS preflights carry no custom headers and pass; the request that follows is checked.
 */
@Injectable()
export class DesktopTokenMiddleware implements NestMiddleware {
  private readonly token: Buffer;

  constructor(token: string) {
    this.token = Buffer.from(token, 'utf8');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (
      req.method === 'OPTIONS' ||
      this.matches(req.headers[DESKTOP_TOKEN_HEADER])
    ) {
      next();
      return;
    }
    sendProblem(res, {
      status: 401,
      detail: 'Token do aplicativo ausente ou inválido',
    });
  }

  private matches(header: string | string[] | undefined): boolean {
    if (typeof header !== 'string') return false;
    const given = Buffer.from(header, 'utf8');
    return (
      given.length === this.token.length && timingSafeEqual(given, this.token)
    );
  }
}
