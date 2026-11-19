import { Notification } from './notification';

export abstract class NotificationRepository {
  /** RN-39: false when a notification with the same key already exists. */
  abstract createOnce(notification: Notification): Promise<boolean>;
  abstract save(notification: Notification): Promise<Notification>;
  abstract findById(ownerId: string, id: string): Promise<Notification | null>;
  /** Newest first. */
  abstract findRecent(
    ownerId: string,
    unreadOnly: boolean,
    limit: number,
  ): Promise<Notification[]>;
  abstract countUnread(ownerId: string): Promise<number>;
  abstract markAllRead(ownerId: string, now: Date): Promise<void>;
}
