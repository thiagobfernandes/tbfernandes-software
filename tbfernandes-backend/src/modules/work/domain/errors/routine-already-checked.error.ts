import { ConflictError } from '../../../../common/domain';

export class RoutineAlreadyCheckedError extends ConflictError {
  constructor() {
    super('RN-33', 'Essa rotina já foi marcada como feita nesse dia');
  }
}
