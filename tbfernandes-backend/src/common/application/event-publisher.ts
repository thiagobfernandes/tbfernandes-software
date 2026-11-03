import { DomainEvent } from '../domain';

/** Publishes domain events to other modules. Inside a UnitOfWork they leave after commit. */
export abstract class EventPublisher {
  abstract publish<E extends DomainEvent>(event: E): void;
}
