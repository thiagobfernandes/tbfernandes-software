import { BusinessRuleViolationError } from '../../../../common/domain';

export class ClosedMonthError extends BusinessRuleViolationError {
  constructor(month: string) {
    super('RN-PLN-01', `O mês ${month} está fechado e não aceita alterações`);
  }
}
