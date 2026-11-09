import { DomainError } from './domain.error';

export class TooManyRequestsError extends DomainError {
  constructor(message = 'Muitas requisições. Tente de novo em instantes.') {
    super(message);
  }
}
