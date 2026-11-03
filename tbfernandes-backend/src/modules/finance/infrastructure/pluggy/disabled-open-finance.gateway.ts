import { BusinessRuleViolationError } from '../../../../common/domain';
import { OpenFinanceGateway } from '../../application/open-finance.gateway';

function disabled(): never {
  throw new BusinessRuleViolationError(
    'RN-15',
    'O Open Finance está desativado; use lançamentos manuais',
  );
}

/** Default while open finance is off: manual entries keep working (RN-15). */
export class DisabledOpenFinanceGateway extends OpenFinanceGateway {
  enabled(): boolean {
    return false;
  }

  createConnectToken(): Promise<never> {
    return Promise.resolve().then(disabled);
  }

  getConnection(): Promise<never> {
    return Promise.resolve().then(disabled);
  }

  listAccounts(): Promise<never> {
    return Promise.resolve().then(disabled);
  }

  listTransactions(): Promise<never> {
    return Promise.resolve().then(disabled);
  }

  deleteConnection(): Promise<never> {
    return Promise.resolve().then(disabled);
  }
}
