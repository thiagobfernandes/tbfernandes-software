import type { Observable } from 'rxjs';
import type { Notification } from '../domain';

/** Pushes new notifications to the open screens (one backend instance: in memory). */
export abstract class NotificationChannel {
  abstract push(notification: Notification): void;
  abstract stream(ownerId: string): Observable<Notification>;
}
