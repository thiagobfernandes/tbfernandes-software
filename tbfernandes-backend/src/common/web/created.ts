import type { Response } from 'express';

export function created<T extends { id: string }>(
  res: Response,
  collection: string,
  body: T,
): T {
  res.location(`/api/v1/${collection}/${body.id}`);
  return body;
}
