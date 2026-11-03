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

/** A field is missing or malformed (HTTP 400). */
export class InvalidArgumentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/** The resource does not exist or belongs to another owner (HTTP 404). */
export class NotFoundError extends DomainError {
  /** @param resource e.g. "A tarefa", "O projeto" */
  constructor(resource: string, id: string) {
    super(`${resource} ${id} não existe`);
  }
}

/**
 * A well formed request that breaks a business rule, documented as RN-xx in
 * docs/backend/requisitos.md (HTTP 422).
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(
    readonly rule: string,
    message: string,
  ) {
    super(message);
  }
}

/** The request conflicts with the current state, e.g. RN-01 (HTTP 409). */
export class ConflictError extends BusinessRuleViolationError {}

/** An external provider failed or could not be reached (HTTP 502). */
export class ExternalServiceError extends DomainError {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

/** The request has no signed-in owner (HTTP 401). */
export class UnauthenticatedError extends DomainError {
  constructor(message = 'Entre primeiro') {
    super(message);
  }
}
