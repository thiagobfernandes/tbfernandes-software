import { BankConnection } from './bank-connection';

/** Implemented in infrastructure/persistence. */
export abstract class BankConnectionRepository {
  abstract save(connection: BankConnection): Promise<BankConnection>;
  /**
   * Stores the connection unless its external id is taken, and returns the one stored. The
   * widget callback and the webhook arrive together, so both must be able to register it.
   */
  abstract saveIfAbsent(connection: BankConnection): Promise<BankConnection>;
  abstract findById(
    ownerId: string,
    id: string,
  ): Promise<BankConnection | null>;
  /** Webhooks only carry the provider's id, so this one is not scoped by owner. */
  abstract findByExternalId(externalId: string): Promise<BankConnection | null>;
  /**
   * Holds the row until the transaction ends, so two syncs of one connection run in turn.
   * Null when the row is gone. Only inside a UnitOfWork.
   */
  abstract lockByExternalId(externalId: string): Promise<BankConnection | null>;
  /** Ordered by institution. */
  abstract findAll(ownerId: string): Promise<BankConnection[]>;
  abstract delete(connection: BankConnection): Promise<void>;
}
