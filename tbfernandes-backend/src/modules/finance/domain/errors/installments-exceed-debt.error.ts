import { BusinessRuleViolationError } from '../../../../common/domain';

export class InstallmentsExceedDebtError extends BusinessRuleViolationError {
  constructor(name: string) {
    super(
      'RN-PLN-02',
      `As parcelas de "${name}" ultrapassam o total da dívida. Ajuste o valor, o término ou o total`,
    );
  }
}
