import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import { NotificationChannel } from '../../application/notification-channel';
import type { Notification } from '../../domain';

@Injectable()
export class InMemoryNotificationChannel extends NotificationChannel {
  private readonly pushed = new Subject<Notification>();

  push(notification: Notification): void {
    this.pushed.next(notification);
  }

  stream(ownerId: string): Observable<Notification> {
    return this.pushed.pipe(
      filter((notification) => notification.ownerId === ownerId),
    );
  }
}
