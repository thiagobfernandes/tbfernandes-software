import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { InvalidArgumentError } from '../domain';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/**
 * PLT-09: every list accepts `page` (from 0) and `size` (1..200, default 50). Without `page`
 * the whole list comes back. Totals go in X-Total-Count, X-Page and X-Page-Size, so the body
 * stays an array. The slice is taken after the query, which is fine at one person's volume.
 */
@Injectable()
export class PagingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const pageParam = req.query?.page;
    if (pageParam === undefined) return next.handle();
    const page = Math.max(0, PagingInterceptor.parse(pageParam, 0));
    const size = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, PagingInterceptor.parse(req.query.size, DEFAULT_PAGE_SIZE)),
    );
    return next.handle().pipe(
      map((body: unknown) => {
        if (!Array.isArray(body)) return body;
        const list = body as unknown[];
        const res = http.getResponse<Response>();
        res.setHeader('X-Total-Count', String(list.length));
        res.setHeader('X-Page', String(page));
        res.setHeader('X-Page-Size', String(size));
        return list.slice(page * size, page * size + size);
      }),
    );
  }

  private static parse(value: unknown, fallback: number): number {
    if (value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed))
      throw new InvalidArgumentError('page e size precisam ser números');
    return parsed;
  }
}
