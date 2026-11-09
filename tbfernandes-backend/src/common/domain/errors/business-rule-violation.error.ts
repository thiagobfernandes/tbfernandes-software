import { DomainError } from './domain.error';

export class BusinessRuleViolationError extends DomainError {
  constructor(
    readonly rule: string,
    message: string,
  ) {
    super(message);
  }
}
