import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../context/request-context';
import { isUuid } from '../domain';
import { sendProblem } from '../protocols/problem-detail';

export const CLIENT_ID_HEADER = 'x-client-id';

/**
 * ADR-007: on a POST, `X-Client-Id: <uuid>` sets the id of the record the request creates.
 * Without the header the server picks the id.
 */
@Injectable()
export class ClientIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers[CLIENT_ID_HEADER];
    if (typeof header !== 'string' || req.method !== 'POST') {
      next();
      return;
    }
    const id = header.trim();
    if (!isUuid(id)) {
      sendProblem(res, {
        status: 400,
        detail: 'X-Client-Id precisa ser um UUID',
      });
      return;
    }
    const state = RequestContext.current();
    if (state) state.requestedClientId = id.toLowerCase();
    next();
  }
}
