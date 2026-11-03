import { DomainEvent } from '../../../common/domain';
import { EntryScope } from '../domain';

export const CONNECTION_SYNC_REQUESTED = 'finance.connection-sync-requested';

/**
 * Sync one connection after this transaction commits. Webhooks must answer within 10 seconds
 * and a sync calls the bank provider, so it never runs in the request. Internal to finance.
 */
export interface ConnectionSyncRequested extends DomainEvent {
  readonly type: typeof CONNECTION_SYNC_REQUESTED;
  readonly externalId: string;
  /** Set when the connection may not be registered yet: the scope to register it with. */
  readonly scope: EntryScope | null;
}

export function connectionSyncRequested(
  externalId: string,
  ownerId: string,
  scope: EntryScope | null,
): ConnectionSyncRequested {
  return { type: CONNECTION_SYNC_REQUESTED, externalId, ownerId, scope };
}
