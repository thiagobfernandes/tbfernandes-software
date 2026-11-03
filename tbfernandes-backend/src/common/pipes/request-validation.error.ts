/** A request body or query that failed its schema (HTTP 400 with "errors" by field). */
export class RequestValidationError extends Error {
  constructor(readonly errors: Record<string, string[]>) {
    super('Requisição inválida');
    this.name = 'RequestValidationError';
  }
}
