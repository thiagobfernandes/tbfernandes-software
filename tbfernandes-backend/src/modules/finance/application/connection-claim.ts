import { ENTRY_SCOPES, EntryScope } from '../domain';

const SEPARATOR = ':';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Who a connection being created belongs to, sent to the provider as its clientUserId and
 * returned in webhooks. The widget's callback is not guaranteed to run, and the webhook can
 * arrive first, so the webhook alone must be able to register the connection with the scope
 * the user chose.
 */
export interface ConnectionClaim {
  ownerId: string;
  scope: EntryScope;
}

export const ConnectionClaims = {
  encode(claim: ConnectionClaim): string {
    return `${claim.ownerId}${SEPARATOR}${claim.scope}`;
  },

  parse(clientUserId: string | null | undefined): ConnectionClaim | null {
    const parts = clientUserId?.split(SEPARATOR) ?? [];
    if (parts.length !== 2) return null;
    const [ownerId, scope] = parts;
    return UUID.test(ownerId) &&
      (ENTRY_SCOPES as readonly string[]).includes(scope)
      ? { ownerId: ownerId.toLowerCase(), scope: scope as EntryScope }
      : null;
  },
};
