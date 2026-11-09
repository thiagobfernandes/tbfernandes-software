import { TooManyRequestsError } from '../../../../common/domain';

export class TooManyLoginAttemptsError extends TooManyRequestsError {
  constructor() {
    super('Muitas tentativas de login. Tente de novo em um minuto.');
  }
}
