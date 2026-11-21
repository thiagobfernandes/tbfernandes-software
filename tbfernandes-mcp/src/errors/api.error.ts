import type { ResponseBody } from '../api/response-body.ts';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ResponseBody;

  constructor(status: number, body: ResponseBody) {
    super(
      `API ${String(status)}: ${problemDetail(body)}${validationErrors(body)}`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function problemDetail(body: ResponseBody): string {
  if (typeof body === 'string') return body || 'erro';
  const detail = body?.['detail'] ?? body?.['title'];
  return typeof detail === 'string' ? detail : 'erro';
}

function validationErrors(body: ResponseBody): string {
  if (typeof body !== 'object' || !body?.['errors']) return '';
  return ` ${JSON.stringify(body['errors'])}`;
}
