import { DomainError } from './domain.error';

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Entre primeiro') {
    super(message);
  }
}
