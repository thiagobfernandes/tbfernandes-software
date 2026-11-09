import { UnauthenticatedError } from '../../../../common/domain';

export class InvalidCredentialsError extends UnauthenticatedError {
  constructor() {
    super('E-mail ou senha incorretos');
  }
}
