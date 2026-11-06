import { OptimisticLockVersionMismatchError, QueryFailedError } from 'typeorm';
import { ConflictError, DomainError } from '../../common/domain';
import { RequestContext } from '../../common/context/request-context';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

/**
 * Turns database errors into domain errors, so the HTTP layer only knows DomainError.
 * Returns undefined for anything that is a real failure (HTTP 500).
 */
export function translateDatabaseError(
  error: unknown,
): DomainError | undefined {
  if (error instanceof OptimisticLockVersionMismatchError) {
    return new ConflictError(
      'RNF-CONF-01',
      'O registro foi alterado por outra requisição; recarregue e tente de novo',
    );
  }
  if (!(error instanceof QueryFailedError)) return undefined;
  const code = (error.driverError as { code?: string } | undefined)?.code;
  if (code === UNIQUE_VIOLATION) {
    // ADR-007: the id the client chose for a new record already exists. Refuse, whoever owns it.
    const clientId = RequestContext.current()?.assignedClientId;
    if (clientId)
      return new ConflictError('ADR-007', `O id ${clientId} já está em uso`);
    return new ConflictError(
      'DB-UNIQUE',
      'A requisição conflita com dados existentes',
    );
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return new ConflictError(
      'DB-FK',
      'A requisição conflita com dados existentes',
    );
  }
  return undefined;
}
