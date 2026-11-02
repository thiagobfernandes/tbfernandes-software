import { AsyncLocalStorage } from 'node:async_hooks';
import type { EntityManager } from 'typeorm';

interface TransactionState {
  manager: EntityManager;
  afterCommit: Array<() => void>;
}

const storage = new AsyncLocalStorage<TransactionState>();

/** The transaction the current use case runs in, if any. */
export const TransactionContext = {
  run<T>(
    manager: EntityManager,
    work: () => Promise<T>,
    afterCommit: Array<() => void>,
  ): Promise<T> {
    return storage.run({ manager, afterCommit }, work);
  },

  current(): TransactionState | undefined {
    return storage.getStore();
  },
};
