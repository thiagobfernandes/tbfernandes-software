import { Injectable } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';
import {
  WorkerChannel,
  WorkerEvent,
  WorkerPresence,
} from '../../application/worker-channel';

interface OwnedEvent extends WorkerEvent {
  ownerId: string;
}

/** The worker's connection, kept in this process (the backend runs as one instance). */
@Injectable()
export class InMemoryWorkerChannel extends WorkerChannel {
  private readonly events = new Subject<OwnedEvent>();
  private readonly connections = new Map<string, number>();
  private readonly lastSeen = new Map<string, Date>();

  publish(ownerId: string, event: WorkerEvent): void {
    this.events.next({ ...event, ownerId });
  }

  presence(ownerId: string): WorkerPresence {
    return {
      connected: (this.connections.get(ownerId) ?? 0) > 0,
      lastSeenAt: this.lastSeen.get(ownerId) ?? null,
    };
  }

  /** Events for one owner while the stream is open; counts the worker as connected. */
  stream(ownerId: string): Observable<WorkerEvent> {
    return new Observable<WorkerEvent>((subscriber) => {
      this.seen(ownerId, 1);
      const subscription = this.events
        .pipe(
          filter((event) => event.ownerId === ownerId),
          map(({ type, requestId }) => ({ type, requestId })),
        )
        .subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        this.seen(ownerId, -1);
      };
    });
  }

  private seen(ownerId: string, change: number): void {
    this.connections.set(
      ownerId,
      Math.max(0, (this.connections.get(ownerId) ?? 0) + change),
    );
    this.lastSeen.set(ownerId, new Date());
  }
}
