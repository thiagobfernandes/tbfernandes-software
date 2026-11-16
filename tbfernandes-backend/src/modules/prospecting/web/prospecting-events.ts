import {
  CallHandler,
  Controller,
  ExecutionContext,
  Inject,
  Injectable,
  MessageEvent,
  NestInterceptor,
  Sse,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import {
  filter,
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
  tap,
} from 'rxjs';
import { OwnerContext } from '../../../common/application';
import { prospectingConfig } from '../../../infrastructure/environments/registers';

@Injectable()
export class ProspectingEvents {
  private readonly changes = new Subject<string>();

  publish(ownerId: string): void {
    this.changes.next(ownerId);
  }

  stream(ownerId: string): Observable<MessageEvent> {
    return merge(
      of({ type: 'changed', data: {} }),
      this.changes.pipe(
        filter((changedOwner) => changedOwner === ownerId),
        map(() => ({ type: 'changed', data: {} })),
      ),
      interval(25_000).pipe(map(() => ({ type: 'ping', data: {} }))),
    );
  }
}

/** Controller promises resolve after the unit of work commits. */
@Injectable()
export class ProspectingChangesInterceptor implements NestInterceptor {
  constructor(
    private readonly events: ProspectingEvents,
    private readonly owner: OwnerContext,
    @Inject(prospectingConfig.KEY)
    private readonly config: ConfigType<typeof prospectingConfig>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'GET') return next.handle();
    const ownerId = request.originalUrl.includes('/webhooks/prospecting')
      ? this.config.ownerId
      : this.owner.currentOwnerId();
    return next.handle().pipe(tap(() => this.events.publish(ownerId)));
  }
}

@Controller('prospecting')
export class ProspectingEventsController {
  constructor(
    private readonly events: ProspectingEvents,
    private readonly owner: OwnerContext,
  ) {}

  @Sse('events')
  eventsStream(): Observable<MessageEvent> {
    return this.events.stream(this.owner.currentOwnerId());
  }
}
