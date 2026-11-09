export class RequestValidationError extends Error {
  constructor(readonly errors: Record<string, string[]>) {
    super('Requisição inválida');
    this.name = 'RequestValidationError';
  }
}
