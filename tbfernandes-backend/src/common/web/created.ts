import type { Response } from 'express';

/** 201 with the new resource's URL in Location (the status comes from @Post). */
export function created<T extends { id: string }>(
  res: Response,
  collection: string,
  body: T,
): T {
  res.location(`/api/v1/${collection}/${body.id}`);
  return body;
}
