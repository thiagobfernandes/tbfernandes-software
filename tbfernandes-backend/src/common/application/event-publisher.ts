import { DomainEvent } from '../domain';

export abstract class EventPublisher {
  abstract publish<E extends DomainEvent>(event: E): void;
}
