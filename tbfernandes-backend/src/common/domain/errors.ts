/**
 * Errors the domain and the use cases raise. Each one maps to one HTTP status in
 * ProblemDetailsFilter, so neither layer knows about HTTP.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidArgumentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} não existe`);
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(
    readonly rule: string,
    message: string,
  ) {
    super(message);
  }
}

export class ConflictError extends BusinessRuleViolationError {}

export class ExternalServiceError extends DomainError {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Entre primeiro') {
    super(message);
  }
}
