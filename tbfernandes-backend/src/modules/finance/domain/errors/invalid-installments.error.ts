import { BusinessRuleViolationError } from '../../../../common/domain';

export class InvalidInstallmentsError extends BusinessRuleViolationError {
  constructor(message: string) {
    super('RN-PLN-03', message);
  }
}
