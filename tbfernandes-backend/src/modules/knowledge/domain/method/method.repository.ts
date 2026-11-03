import { Method } from './method';

/** Implemented in infrastructure/persistence. */
export abstract class MethodRepository {
  abstract create(method: Method): Promise<Method>;
  abstract save(method: Method): Promise<Method>;
  abstract findById(ownerId: string, id: string): Promise<Method | null>;
  /** Ordered by title. */
  abstract findAll(ownerId: string): Promise<Method[]>;
  abstract delete(method: Method): Promise<void>;
}
