import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';

/** What the current HTTP request carries for code that has no access to it. */
export interface RequestState {
  request?: Request;
  /** X-Client-Id of a POST, not used yet (ADR-007). */
  requestedClientId?: string;
  /** The client id once a new aggregate took it. */
  assignedClientId?: string;
}

const storage = new AsyncLocalStorage<RequestState>();

/**
 * Per-request state kept in AsyncLocalStorage, the Node equivalent of a request-bound
 * thread local. Opened by RequestContextMiddleware for every request.
 */
export const RequestContext = {
  run<T>(state: RequestState, callback: () => T): T {
    return storage.run(state, callback);
  },

  current(): RequestState | undefined {
    return storage.getStore();
  },

  request(): Request | undefined {
    return storage.getStore()?.request;
  },
};
