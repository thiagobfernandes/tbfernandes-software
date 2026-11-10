import { ConflictError } from '../../../../common/domain';

export class TimeEntryAlreadyRunningError extends ConflictError {
  constructor() {
    super(
      'RN-28',
      'Já existe um apontamento em andamento; pare-o antes de iniciar outro',
    );
  }
}
