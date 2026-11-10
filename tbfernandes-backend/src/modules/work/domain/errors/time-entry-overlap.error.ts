import { BusinessRuleViolationError } from '../../../../common/domain';

export class TimeEntryOverlapError extends BusinessRuleViolationError {
  constructor() {
    super('RN-30', 'Já existe um apontamento nesse horário');
  }
}
