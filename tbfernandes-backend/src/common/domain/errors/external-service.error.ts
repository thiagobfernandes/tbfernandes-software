import { DomainError } from './domain.error';

export class ExternalServiceError extends DomainError {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
