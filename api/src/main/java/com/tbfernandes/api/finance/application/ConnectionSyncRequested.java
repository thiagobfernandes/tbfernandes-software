package com.tbfernandes.api.finance.application;

import java.util.UUID;

import com.tbfernandes.api.finance.domain.EntryScope;

/**
 * Sync one connection after this transaction commits. Webhooks must answer within 10 seconds and
 * a sync calls the bank provider, so it never runs in the request.
 *
 * @param ownerId who the connection is registered to if it is not known yet
 * @param scope the scope it is registered with if it is not known yet
 */
record ConnectionSyncRequested(String externalId, UUID ownerId, EntryScope scope) {
}
