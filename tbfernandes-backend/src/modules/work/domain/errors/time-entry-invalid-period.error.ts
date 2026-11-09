import { BusinessRuleViolationError } from '../../../../common/domain';

export class TimeEntryInvalidPeriodError extends BusinessRuleViolationError {
  constructor(message: string) {
    super('RN-29', message);
  }

  static endBeforeStart(): TimeEntryInvalidPeriodError {
    return new TimeEntryInvalidPeriodError(
      'O fim do apontamento precisa ser depois do início',
    );
  }

  static inTheFuture(): TimeEntryInvalidPeriodError {
    return new TimeEntryInvalidPeriodError(
      'O apontamento não pode começar nem terminar no futuro',
    );
  }
}
