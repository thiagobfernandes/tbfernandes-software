import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Clock, IdGenerator, OwnerContext } from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  Notification,
  NotificationContent,
  NotificationRepository,
} from '../domain';
import { NotificationChannel } from './notification-channel';

const RECENT = 50;

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly channel: NotificationChannel,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  /** RN-39: creates it once per key and pushes it to the open screens. */
  async notify(
    ownerId: string,
    content: NotificationContent,
  ): Promise<Notification | null> {
    const notification = Notification.create(
      this.ids.newId(),
      ownerId,
      content,
      this.clock.now(),
    );
    if (!(await this.notifications.createOnce(notification))) return null;
    this.channel.push(notification);
    return notification;
  }

  list(unreadOnly: boolean): Promise<Notification[]> {
    return this.notifications.findRecent(
      this.owner.currentOwnerId(),
      unreadOnly,
      RECENT,
    );
  }

  unreadCount(): Promise<number> {
    return this.notifications.countUnread(this.owner.currentOwnerId());
  }

  async markRead(id: string): Promise<Notification> {
    const ownerId = this.owner.currentOwnerId();
    const notification = await this.notifications.findById(ownerId, id);
    if (!notification) throw new NotFoundError('A notificação', id);
    notification.markRead(this.clock.now());
    return this.notifications.save(notification);
  }

  markAllRead(): Promise<void> {
    return this.notifications.markAllRead(
      this.owner.currentOwnerId(),
      this.clock.now(),
    );
  }

  stream(): Observable<Notification> {
    return this.channel.stream(this.owner.currentOwnerId());
  }
}
