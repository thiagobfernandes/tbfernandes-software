import { BusinessRuleViolationError } from '../../../../common/domain';

export class RoutineNotDueError extends BusinessRuleViolationError {
  constructor(message: string) {
    super('RN-32', message);
  }

  static notScheduled(): RoutineNotDueError {
    return new RoutineNotDueError(
      'A rotina não está programada para esse dia (pausada, antes do início ou fora dos dias da semana)',
    );
  }

  static inTheFuture(): RoutineNotDueError {
    return new RoutineNotDueError(
      'Não dá para marcar uma rotina num dia futuro',
    );
  }
}
