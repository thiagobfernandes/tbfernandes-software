import type { Response } from 'express';

/** Error body of every failed request (RFC 9457), the shape the frontend's client.ts reads. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  rule?: string;
  errors?: Record<string, string[]>;
}

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Content',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
};

export function problem(body: ProblemDetail): ProblemDetail {
  return { type: 'about:blank', title: TITLES[body.status], ...body };
}

/** Writes a problem from code that runs outside Nest's exception filters (middlewares). */
export function sendProblem(res: Response, body: ProblemDetail): void {
  res
    .status(body.status)
    .type('application/problem+json')
    .send(JSON.stringify(problem(body)));
}
