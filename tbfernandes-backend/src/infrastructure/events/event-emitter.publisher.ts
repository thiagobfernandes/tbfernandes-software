import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisher } from '../../common/application';
import { DomainEvent } from '../../common/domain';
import { TransactionContext } from '../database/transactions';
import { Logger } from '../logger';

/**
 * Domain events on @nestjs/event-emitter. Inside a transaction they go out after the
 * commit, so a listener never sees a change that was rolled back. Listeners in other modules
 * use `@OnEvent(<type>, { async: true })`.
 */
@Injectable()
export class EventEmitterPublisher extends EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  publish<E extends DomainEvent>(event: E): void {
    const emit = () => {
      this.emitter
        .emitAsync(event.type, event)
        .catch((error: unknown) =>
          Logger.error(`Listener of ${event.type} failed`, error),
        );
    };
    const transaction = TransactionContext.current();
    if (transaction) transaction.afterCommit.push(emit);
    else emit();
  }
}
