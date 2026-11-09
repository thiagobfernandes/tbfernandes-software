import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';

export interface RequestState {
  request?: Request;
  requestedClientId?: string;
  assignedClientId?: string;
}

const storage = new AsyncLocalStorage<RequestState>();

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
